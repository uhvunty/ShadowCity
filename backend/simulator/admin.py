from django.contrib import admin
from .models import SimulationRun

@admin.register(SimulationRun)
class SimulationRunAdmin(admin.ModelAdmin):
    list_display = ("id", "scenario_name", "event_type", "created_at")
    list_filter = ("event_type",)
