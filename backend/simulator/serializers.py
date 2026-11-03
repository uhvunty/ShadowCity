
from rest_framework import serializers


class SimulationRequestSerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(
        choices=["flood", "road_closure"],
        default="flood",
    )

    scenario_name = serializers.CharField(
        max_length=160,
        required=False,
        default="Untitled scenario",
    )

    rainfall = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=150,
        default=70,
    )

    drainage_blockage = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=100,
        default=40,
    )

    risk_threshold = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=1,
        default=0.58,
    )

    closed_road_ids = serializers.ListField(
        child=serializers.CharField(max_length=20),
        required=False,
        default=list,
    )


class RouteRequestSerializer(serializers.Serializer):
    start = serializers.CharField(max_length=10)
    destination = serializers.CharField(max_length=10)

    preference = serializers.ChoiceField(
        choices=["shortest", "safest", "balanced"],
        default="shortest",
    )

    closed_road_ids = serializers.ListField(
        child=serializers.CharField(max_length=20),
        required=False,
        default=list,
    )

    avoid_flooded = serializers.BooleanField(default=False)

    rainfall = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=150,
        default=100,
    )

    drainage_blockage = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=100,
        default=50,
    )

    risk_threshold = serializers.FloatField(
        required=False,
        min_value=0,
        max_value=1,
        default=0.58,
    )

