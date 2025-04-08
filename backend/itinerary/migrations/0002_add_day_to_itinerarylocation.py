# itinerary/migrations/0002_add_day_to_itinerarylocation.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('itinerary', '0001_initial')]
    operations = [
        migrations.AddField(
            model_name='itinerarylocation',
            name='day',
            field=models.IntegerField(default=1),
        ),
    ]