from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryViewSet, ProductViewSet, ProductVariantViewSet,
    OrderViewSet, RegisterView, UserProfileView, home,
    UserViewSet, AdminStatsView, ColorViewSet, SizeViewSet, ProductImageViewSet, related_products

)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'users', UserViewSet, basename='user')
router.register(r'colors', ColorViewSet, basename='color')
router.register(r'sizes', SizeViewSet, basename='size')
router.register(r'product-images', ProductImageViewSet, basename='product-image')


urlpatterns = [
    path('', home, name='home'),
    path('api/', include(router.urls)),
    # Auth URLs
    path('api/register/', RegisterView.as_view(), name='auth_register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('api/products/<slug:slug>/related/', related_products, name='related_products'),

]