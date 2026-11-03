from django.core.management.base import BaseCommand
from simulator.models import SimulationRun

class Command(BaseCommand):
    help = "Initialise the ShadowCity demo database (demo geography is served from Python fixtures)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(
            "ShadowCity demo data is loaded from simulator/demo_data.py. No database seeding required."
        ))
