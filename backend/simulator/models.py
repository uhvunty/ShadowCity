from django.db import models

class SimulationRun(models.Model):
    EVENT_CHOICES = [
        ("flood", "Flood"),
        ("road_closure", "Road closure"),
    ]
    scenario_name = models.CharField(max_length=160, default="Untitled scenario")
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    parameters = models.JSONField(default=dict)
    results = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.scenario_name} ({self.event_type})"
