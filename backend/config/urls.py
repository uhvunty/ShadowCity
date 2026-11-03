
from django.contrib import admin
from django.urls import path
from simulator import views

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/health/", views.health),
    path("api/neighbourhood/", views.neighbourhood),

    path("api/simulations/run/", views.run_simulation),
    path("api/simulations/", views.simulation_list),

    path("api/routes/plan/", views.plan_route),

    path("api/explain/", views.explain),
]
