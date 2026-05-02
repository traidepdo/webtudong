from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Category, Color, Size, Product, ProductImage, ProductVariant, Order, OrderItem, Payment, Profile
import json
import uuid

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)
    size_name = serializers.CharField(source='size.name', read_only=True)
    # Vì price đã là @property trong Model mới, chỉ cần khai báo như sau:
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    # Lấy thêm URL ảnh đại diện của màu sắc này
    variant_image_url = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'color', 'color_name', 'size', 'size_name', 'sku', 'stock_quantity', 'price', 'variant_image_url']

class ProductSerializer(serializers.ModelSerializer):
    # lấy danh sách các variant của product
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    # lấy name danh mục
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'category_name', 'name', 'slug', 'description', 'created_at', 'variants', 'images']
    def create(self, validated_data):
        validated_data.pop('variants', None)
        validated_data.pop('images', None)

        product = Product.objects.create(**validated_data)

        # ==========================================
        # 3. LƯU BIẾN THỂ
        # ==========================================
        variants_str = self.initial_data.get('variants', '[]')
        try:
            variants_data = json.loads(variants_str)
        except Exception:
            variants_data = []

        # Track variant vừa tạo theo color_id → dùng để gắn vào ảnh
        created_variants_by_color = {}

        for variant in variants_data:
            color_id = variant.get('color')
            color_id = int(color_id) if color_id else None

            size_id = variant.get('size')
            size_id = int(size_id) if size_id else None

            price = variant.get('price')
            price = float(price) if price else 0.0

            stock = variant.get('stock_quantity')
            stock = int(stock) if stock else 0

            if not color_id or not size_id:
                continue

            sku = variant.get('sku')
            if not sku:
                random_string = uuid.uuid4().hex[:6].upper()
                sku = f"PRD{product.id}-C{color_id}-S{size_id}-{random_string}"

            new_variant = ProductVariant.objects.create(
                product=product,
                color_id=color_id,
                size_id=size_id,
                price=price,
                stock_quantity=stock,
                sku=sku
            )

            # Lưu lại — nếu 1 màu có nhiều size, lấy variant đầu tiên làm đại diện cho ảnh
            if color_id not in created_variants_by_color:
                created_variants_by_color[color_id] = new_variant

        # ==========================================
        # 4. LƯU ẢNH — gắn đúng variant theo color
        # ==========================================
        images_info_str = self.initial_data.get('images', '[]')
        try:
            images_info = json.loads(images_info_str)
        except Exception:
            images_info = []

        uploaded_images = self.context['request'].FILES.getlist('uploaded_images')

        for info, image_file in zip(images_info, uploaded_images):
            img_color_id = info.get('color')
            img_color_id = int(img_color_id) if img_color_id else None

            # Tìm variant tương ứng với màu của ảnh
            linked_variant = created_variants_by_color.get(img_color_id)

            ProductImage.objects.create(
                product=product,
                variant=linked_variant,   # ← gắn variant vào đây
                color_id=img_color_id,
                image=image_file,
                is_primary=info.get('is_primary', False)
            )

        return product
    def update(self, instance, validated_data):
        # 1. Cập nhật Product gốc
        instance.name = validated_data.get('name', instance.name)
        instance.category = validated_data.get('category', instance.category)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        # 2. Xử lý Variants
        variants_data_str = self.initial_data.get('variants', '[]')
        try:
            variants_data = json.loads(variants_data_str)
        except Exception:
            variants_data = []

        # IDs variant giữ lại (có id) → những cái không có trong list này sẽ bị xóa
        kept_variant_ids = [v['id'] for v in variants_data if v.get('id')]

        # Xóa variant không còn trong danh sách
        ProductVariant.objects.filter(
            product=instance
        ).exclude(id__in=kept_variant_ids).delete()

        newly_created_variants = {}

        for v_data in variants_data:
            variant_id = v_data.get('id')
            color_id = int(v_data['color']) if v_data.get('color') else None
            size_id = int(v_data['size']) if v_data.get('size') else None
            price = float(v_data['price']) if v_data.get('price') else 0.0
            stock = int(v_data['stock_quantity']) if v_data.get('stock_quantity') else 0

            if not color_id or not size_id:
                continue

            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id, product=instance)
                    variant.color_id = color_id
                    variant.size_id = size_id
                    variant.price = price
                    variant.stock_quantity = stock
                    variant.save()
                except ProductVariant.DoesNotExist:
                    continue
            else:
                exists = ProductVariant.objects.filter(
                    product=instance, color_id=color_id, size_id=size_id
                ).exists()
                if not exists:
                    random_string = uuid.uuid4().hex[:6].upper()
                    sku = f"PRD{instance.id}-C{color_id}-S{size_id}-{random_string}"
                    new_variant = ProductVariant.objects.create(
                        product=instance,
                        color_id=color_id,
                        size_id=size_id,
                        price=price,
                        stock_quantity=stock,
                        sku=sku
                    )
                    newly_created_variants[color_id] = new_variant

        # 3. Xử lý ảnh
        # Xóa ảnh nếu frontend gửi danh sách image_ids cần xóa
        delete_image_ids_str = self.initial_data.get('delete_image_ids', '[]')
        try:
            delete_image_ids = json.loads(delete_image_ids_str)
            if delete_image_ids:
                ProductImage.objects.filter(
                    product=instance, id__in=delete_image_ids
                ).delete()
        except Exception:
            pass

        uploaded_images = self.context['request'].FILES
        images_info_str = self.initial_data.get('images', '[]')
        try:
            images_info = json.loads(images_info_str)
        except Exception:
            images_info = []

        for info in images_info:
            color_id = int(info['color']) if info.get('color') else None
            file_key = info.get('file_key')
            image_file = uploaded_images.get(file_key)
            if not image_file or not color_id:
                continue

            variant_to_link = newly_created_variants.get(color_id)
            if not variant_to_link:
                variant_to_link = ProductVariant.objects.filter(
                    product=instance, color_id=color_id
                ).first()

            img_obj, created = ProductImage.objects.get_or_create(
                product=instance,
                color_id=color_id,
                defaults={
                    'is_primary': info.get('is_primary', False),
                    'variant': variant_to_link,
                }
            )
            img_obj.image = image_file
            if img_obj.variant is None and variant_to_link:
                img_obj.variant = variant_to_link
            img_obj.save()

        return instance

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'variant', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)  # ❌ bỏ read_only=True

    class Meta:
        model = Order
        fields = ['id', 'user', 'full_name', 'phone_number', 'shipping_address', 'total_amount', 'status', 'created_at', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])  # tách items ra trước
        
        order = Order.objects.create(**validated_data)  # tạo order
        
        for item in items_data:  # tạo từng OrderItem
            OrderItem.objects.create(order=order, **item)
        
        return order 
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    # Đổi thành date_of_birth cho khớp với Model
    date_of_birth = serializers.DateField(source='profile.date_of_birth', read_only=True)
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'address', 'date_of_birth', 'avatar', 'is_staff')

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    # Gợi ý: Chuyển thành required=False để user dễ dàng đăng ký hơn
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'date_of_birth', 'avatar')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return value
        
    def create(self, validated_data):
        # 1. Lấy dữ liệu Profile (có thêm giá trị mặc định None để không dính KeyError)
        phone_number = validated_data.pop('phone_number', None)
        address = validated_data.pop('address', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        avatar = validated_data.pop('avatar', None)
        
        # 2. Tạo User
        # Use email as username if username is not provided, or just ensure email is there
        username = validated_data.get('username')
        if not username:
            username = validated_data.get('email').split('@')[0] # Fallback
            
        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        # 3. Cập nhật Profile
        profile = user.profile 
        if phone_number:
            profile.phone_number = phone_number
        if address:
            profile.address = address
        if date_of_birth:
            profile.date_of_birth = date_of_birth
        if avatar:
            profile.avatar = avatar
            
        profile.save()

        return user