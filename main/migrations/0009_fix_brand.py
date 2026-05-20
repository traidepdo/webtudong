from django.db import migrations, models
import django.db.models.deletion

def migrate_brand_data(apps, schema_editor):
    Product = apps.get_model('main', 'Product')
    Brand = apps.get_model('main', 'Brand')

    # Lấy tất cả brand text đang có trong Product
    brand_names = Product.objects.exclude(brand='').exclude(brand=None) \
                                 .values_list('brand', flat=True).distinct()

    for name in brand_names:
        brand_obj, _ = Brand.objects.get_or_create(name=name)

    # Gán FK brand_new cho từng product
    for product in Product.objects.all():
        if product.brand:
            brand_obj = Brand.objects.filter(name=product.brand).first()
            if brand_obj:
                product.brand_new = brand_obj
                product.save()

class Migration(migrations.Migration):

    dependencies = [
        ('main', '0008_remove_productimage_variant_and_more'),  # <-- điền tên migration trước đó của bạn
    ]

    operations = [
        # 1. Tạo bảng Brand
        migrations.CreateModel(
            name='Brand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(unique=True, blank=True)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='brands/')),
                ('description', models.TextField(blank=True)),
                ('website', models.URLField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        # 2. Thêm cột FK tạm (nullable)
        migrations.AddField(
            model_name='product',
            name='brand_new',
            field=models.ForeignKey(
                to='main.Brand', on_delete=django.db.models.deletion.SET_NULL,
                null=True, blank=True, related_name='products'
            ),
        ),
        # 3. Copy data từ brand (text) → brand_new (FK)
        migrations.RunPython(migrate_brand_data, migrations.RunPython.noop),
        # 4. Xóa cột brand cũ
        migrations.RemoveField(model_name='product', name='brand'),
        # 5. Đổi tên brand_new → brand
        migrations.RenameField(model_name='product', old_name='brand_new', new_name='brand'),
    ]