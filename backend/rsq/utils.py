def get_stage_status_and_color(stage):
    if stage is None:
        return "No Data", "#95A5A6"  # Grey

    if stage <= 70:
        return "Safe", "#2ECC71"  # Green
    elif stage <= 90:
        return "Semi-Critical", "#F1C40F"  # Yellow
    elif stage <= 100:
        return "Critical", "#E67E22"  # Orange
    else:
        return "Over-Exploited", "#E74C3C"  # Red
