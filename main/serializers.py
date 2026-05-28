from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Category, Color, Size, Product, ProductImage, ProductVariant, Order, OrderItem, Payment, Profile, Review, Brand, BlogCategory, BlogPost, BlogComment, Notification
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

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description', 'website', 'is_active', 'created_at']
        read_only_fields = ['slug', 'created_at']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)
    color_hex = serializers.CharField(source='color.hex_code', read_only=True)
    size_name = serializers.CharField(source='size.name', read_only=True)
    # Vì price đã là @property trong Model mới, chỉ cần khai báo như sau:
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    # Lấy thêm URL ảnh đại diện của màu sắc này
    variant_image_url = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'color', 'color_name', 'color_hex', 'size', 'size_name', 'sku', 'stock_quantity', 'price', 'variant_image_url']

class ProductSerializer(serializers.ModelSerializer):
    # lấy danh sách các variant của product
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    brand_slug = serializers.CharField(source='brand.slug', read_only=True)
    # lấy name danh mục
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'category_slug', 'name', 'slug', 
            'description', 'brand', 'brand_name', 'brand_slug', 'meta_title', 'meta_description',
            'created_at', 'variants', 'images'
        ]
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
        instance.brand = validated_data.get('brand', instance.brand)
        instance.meta_title = validated_data.get('meta_title', instance.meta_title)
        instance.meta_description = validated_data.get('meta_description', instance.meta_description)
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
                }
            )
            img_obj.image = image_file
            img_obj.save()

        return instance

class OrderItemSerializer(serializers.ModelSerializer):
    # Lấy thêm các trường này từ ProductVariant (liên kết qua trường 'variant')
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    color = serializers.CharField(source='variant.color.name', read_only=True)
    size = serializers.CharField(source='variant.size.name', read_only=True)
    
    # Lấy link ảnh từ property variant_image_url của Model ProductVariant
    image = serializers.ReadOnlyField(source='variant.variant_image_url')

    class Meta:
        model = OrderItem
        # Bổ sung các trường mới vào mảng fields để trả về cho Frontend
        fields = ['id', 'variant', 'product_name', 'color', 'size', 'image', 'quantity', 'price']
        read_only_fields = ['price']
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    payment_method = serializers.CharField(write_only=True, required=False)
    payment = serializers.SerializerMethodField()
    
    # Bổ sung các field để khớp với Frontend
    method = serializers.CharField(source='payment.method', read_only=True)
    is_paid = serializers.SerializerMethodField()
    order_code = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_code', 'user', 'full_name', 'phone_number', 'shipping_address',
                  'total_amount', 'status', 'created_at', 'items', 'payment_method', 'payment', 'method', 'is_paid']

    def get_payment(self, obj):
        try:
            payment = obj.payment
            return {"method": payment.method, "status": payment.status}
        except Exception:
            return None

    def get_is_paid(self, obj):
        try:
            return obj.payment.status == 'completed'
        except Exception:
            return False

    def get_order_code(self, obj):
        return f"ORD{obj.id}"

    def create(self, validated_data):
        payment_method = validated_data.pop('payment_method', 'cod')
        items_data = validated_data.pop('items', [])

        order = Order.objects.create(**validated_data)

        for item in items_data:
            OrderItem.objects.create(order=order, **item)

        Payment.objects.create(
            order=order,
            method=payment_method,
            amount=order.total_amount
        )

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
class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()
 
    class Meta:
        model = Review
        fields = ['id', 'user', 'username', 'avatar', 'product', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']
 
    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.user.profile.avatar
            if avatar and request:
                return request.build_absolute_uri(avatar.url)
        except Exception:
            pass
        return None
 
    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None
        product = data.get('product')
 
        can_review, message = Review.user_can_review(user, product)
        if not can_review:
            raise serializers.ValidationError(message)
 
        return data
 
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)

# ==========================================
# BLOG SERIALIZERS
# ==========================================

class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'post_count']
        read_only_fields = ['slug']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class BlogCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = ['id', 'post', 'user', 'username', 'avatar', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.user.profile.avatar
            if avatar and request:
                return request.build_absolute_uri(avatar.url)
        except Exception:
            pass
        return None

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BlogPostListSerializer(serializers.ModelSerializer):
    """Dùng cho trang danh sách — trả ít field để nhẹ"""
    author_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    excerpt = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'thumbnail',
            'author_name', 'category_name', 'category_slug',
            'excerpt', 'views', 'comment_count',
            'published_at', 'created_at',
        ]

    def get_author_name(self, obj):
        if obj.author:
            full = f"{obj.author.first_name} {obj.author.last_name}".strip()
            return full or obj.author.username
        return 'Blue Sky'

    def get_excerpt(self, obj):
        return obj.get_excerpt()

    def get_comment_count(self, obj):
        return obj.comments.count()


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Dùng cho trang chi tiết — trả đầy đủ"""
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    category = BlogCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(), source='category', write_only=True, required=False
    )
    related_products = serializers.SerializerMethodField()
    related_product_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='related_products',
        many=True, write_only=True, required=False
    )
    comments = BlogCommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'thumbnail', 'content', 'excerpt',
            'meta_title', 'meta_description', 'status',
            'banner_color', 'font_family',
            'author_name', 'author_avatar',
            'category', 'category_id',
            'related_products', 'related_product_ids',
            'comments', 'comment_count',
            'views', 'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['slug', 'views', 'published_at', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        if obj.author:
            full = f"{obj.author.first_name} {obj.author.last_name}".strip()
            return full or obj.author.username
        return 'Blue Sky'

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.author.profile.avatar
            if avatar and request:
                return request.build_absolute_uri(avatar.url)
        except Exception:
            pass
        return None

    def get_related_products(self, obj):
        from .serializers import ProductSerializer
        return ProductSerializer(
            obj.related_products.all(), many=True, context=self.context
        ).data

    def get_comment_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        related_products = validated_data.pop('related_products', [])
        post = BlogPost.objects.create(
            author=self.context['request'].user,
            **validated_data
        )
        post.related_products.set(related_products)
        return post

    def update(self, instance, validated_data):
        related_products = validated_data.pop('related_products', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if related_products is not None:
            instance.related_products.set(related_products)
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'order', 'created_at']
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'order', 'created_at']