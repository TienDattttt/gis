import json
import psycopg2
from psycopg2.extras import Json

# Thông tin kết nối đến PostgreSQL (thay đổi theo cấu hình của bạn)
db_params = { "dbname": "dn", "user": "postgres", "password": "1224454", "host": "localhost", "port": "5432" }

# Đường dẫn đến file JSON
json_file_path = "data_dn_3.json"

# Hàm để tính trung bình tọa độ cho "way"
def calculate_centroid(geometry):
    if not geometry:
        return None
    lats = [point["lat"] for point in geometry]
    lons = [point["lon"] for point in geometry]
    avg_lat = sum(lats) / len(lats)
    avg_lon = sum(lons) / len(lons)
    return avg_lat, avg_lon

# Đọc dữ liệu từ file JSON
try:
    with open(json_file_path, 'r', encoding='utf-8') as file:
        json_data = json.load(file)
    print(f"Đã đọc dữ liệu từ file {json_file_path} thành công!")
except FileNotFoundError:
    print(f"Không tìm thấy file {json_file_path}!")
    exit(1)
except json.JSONDecodeError as e:
    print(f"Lỗi khi đọc file JSON: {e}")
    exit(1)

# Kết nối đến cơ sở dữ liệu
try:
    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()
    print("Kết nối đến PostgreSQL thành công!")

    # Duyệt qua từng phần tử trong JSON
    for element in json_data["elements"]:
        # Lấy thông tin cơ bản
        element_id = element["id"]
        element_type = element["type"]
        tags = element.get("tags", {})
        name = tags.get("name")
        name_vi = tags.get("name:vi")
        tourism_type = tags.get("tourism")

        # Xử lý tọa độ geom
        if element_type == "node":
            lat = element.get("lat")
            lon = element.get("lon")
        elif element_type == "way":
            geometry = element.get("geometry", [])
            if geometry:
                lat, lon = calculate_centroid(geometry)
            else:
                lat, lon = None, None
        else:
            lat, lon = None, None

        # Tạo dữ liệu details (gộp các trường)
        details = {
            "title": tags.get("title"),
            "basic_info": tags.get("basic_info", {}),
            "wikipedia": tags.get("wikipedia"),
            "short_description": tags.get("short_description"),
            "description_1": tags.get("description_1"),
            "poem": tags.get("poem"),
            "videos": tags.get("videos", []),
            "description_2": tags.get("description_2")
        }

        # Chèn dữ liệu vào bảng locations
        if lat is not None and lon is not None:
            insert_location_query = """
                INSERT INTO locations (id, type, name, name_vi, tourism_type, geom, details)
                VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
                ON CONFLICT (id) DO NOTHING;
            """
            cur.execute(insert_location_query, (
                element_id,
                element_type,
                name,
                name_vi,
                tourism_type,
                lon,  # Truyền lon trực tiếp
                lat,  # Truyền lat trực tiếp
                Json(details)
            ))
        else:
            # Nếu không có tọa độ, chèn với geom là NULL
            insert_location_query = """
                INSERT INTO locations (id, type, name, name_vi, tourism_type, geom, details)
                VALUES (%s, %s, %s, %s, %s, NULL, %s)
                ON CONFLICT (id) DO NOTHING;
            """
            cur.execute(insert_location_query, (
                element_id,
                element_type,
                name,
                name_vi,
                tourism_type,
                Json(details)
            ))

        # Chèn dữ liệu vào bảng images (image_1 và image_2)
        image_1 = tags.get("image_1", {})
        image_2 = tags.get("image_2", {})

        if image_1.get("url"):
            insert_image_query = """
                INSERT INTO images (location_id, url, caption, image_order)
                VALUES (%s, %s, %s, %s);
            """
            cur.execute(insert_image_query, (
                element_id,
                image_1.get("url"),
                image_1.get("caption"),
                1
            ))

        if image_2.get("url"):
            cur.execute(insert_image_query, (
                element_id,
                image_2.get("url"),
                image_2.get("caption"),
                2
            ))

    # Commit giao dịch
    conn.commit()
    print("Dữ liệu đã được chèn thành công!")

except psycopg2.Error as e:
    print(f"Lỗi khi kết nối hoặc chèn dữ liệu: {e}")
    conn.rollback()

finally:
    if cur:
        cur.close()
    if conn:
        conn.close()
    print("Đã đóng kết nối đến PostgreSQL.")
