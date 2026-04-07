from datetime import datetime, timedelta
import random
from collections import defaultdict

random.seed(42)

CATEGORIES = ['Plumbers', 'Electricians', 'Hospitals', 'Grocery', 'Courier']
AREAS = [
    'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai',
    'Kolkata', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Surat', 'Nagpur', 'Indore', 'Bhopal', 'Patna',
    'Vadodara', 'Coimbatore', 'Visakhapatnam', 'Kochi', 'Chandigarh'
]

# ─── Synthetic Data Generation ───────────────────────────────────────────────

def generate_requests():
    rows = []
    base = datetime(2024, 1, 1)
    for i in range(10000):
        date = base + timedelta(days=random.randint(0, 364))
        area = random.choices(AREAS, weights=[20,18,15,14,10,9,8,6,7,6,5,5,4,4,3,4,3,3,3,3])[0]
        category = random.choices(CATEGORIES, weights=[25,28,18,15,14])[0]
        price = {
            'Plumbers': random.randint(300, 1200),
            'Electricians': random.randint(400, 1500),
            'Hospitals': random.randint(500, 5000),
            'Grocery': random.randint(100, 800),
            'Courier': random.randint(80, 500),
        }[category]
        rows.append({'date': date, 'area': area, 'category': category, 'price': price})
    return rows


def generate_providers():
    rows = []
    for area in AREAS:
        for cat in CATEGORIES:
            count = random.randint(50, 200)
            for _ in range(count):
                rows.append({
                    'area': area,
                    'category': cat,
                    'rating': round(random.uniform(3.0, 5.0), 1),
                    'completed_services': random.randint(5, 300),
                    'response_time_hrs': round(random.uniform(0.5, 24.0), 1),
                })
    return rows


requests_data = generate_requests()
providers_data = generate_providers()


# ─── 1. Demand Trends ────────────────────────────────────────────────────────

def get_demand_trends(area=None, category=None):
    filtered = requests_data
    if area and area != 'All' and area != 'All India':
        filtered = [r for r in filtered if r['area'] == area]
    if category and category != 'All':
        filtered = [r for r in filtered if r['category'] == category]
    
    # Group by month
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    month_counts = {i: 0 for i in range(1, 13)}
    
    for req in filtered:
        month = req['date'].month
        month_counts[month] += 1
    
    result = []
    for month_num in range(1, 13):
        demand_val = month_counts[month_num]
        base_supply = int(demand_val * random.uniform(0.6, 0.8))
        supply_val = max(0, base_supply + random.randint(-demand_val//10 if demand_val > 0 else 0, demand_val//10 if demand_val > 0 else 0))
        result.append({
            'name': month_names[month_num - 1],
            'demand': demand_val,
            'supply': supply_val
        })
    return result


# ─── 2. Category Popularity ──────────────────────────────────────────────────

def get_category_popularity(area=None):
    filtered = requests_data
    if area and area != 'All':
        filtered = [r for r in filtered if r['area'] == area]
    
    counts = defaultdict(int)
    for req in filtered:
        counts[req['category']] += 1
    
    total = sum(counts.values())
    return [{'name': cat, 'value': counts.get(cat, 0), 'percent': round(counts.get(cat, 0) / total * 100, 1) if total > 0 else 0} for cat in CATEGORIES]


# ─── 3. Area-wise Demand ─────────────────────────────────────────────────────

def get_area_demand(category=None):
    filtered = requests_data
    if category and category != 'All':
        filtered = [r for r in filtered if r['category'] == category]
    
    area_cat_counts = {}
    for req in filtered:
        key = (req['area'], req['category'])
        area_cat_counts[key] = area_cat_counts.get(key, 0) + 1
    
    result = []
    for area in AREAS:
        entry = {'area': area}
        for cat in CATEGORIES:
            entry[cat] = area_cat_counts.get((area, cat), 0)
        result.append(entry)
    return result


# ─── 4. Service Gap Detection ────────────────────────────────────────────────

def get_service_gaps():
    demand = {}
    supply = {}
    
    for req in requests_data:
        key = (req['area'], req['category'])
        demand[key] = demand.get(key, 0) + 1
    
    for prov in providers_data:
        key = (prov['area'], prov['category'])
        supply[key] = supply.get(key, 0) + 1
    
    gaps = []
    for area in AREAS:
        for cat in CATEGORIES:
            key = (area, cat)
            d = demand.get(key, 0)
            s = supply.get(key, 0)
            raw_gap = d - (s * 0.1)
            if raw_gap > 0:
                gaps.append({
                    'area': area,
                    'category': cat,
                    'gap': max(0, int(raw_gap)),
                    'demand': d,
                    'supply': s
                })
    
    gaps = sorted(gaps, key=lambda x: x['gap'], reverse=True)[:15]
    return gaps


# ─── 5. Booming Services ────────────────────────────────────────────────────

def get_booming_services(area=None):
    filtered = requests_data
    if area and area != 'All':
        filtered = [r for r in filtered if r['area'] == area]
    
    counts = defaultdict(int)
    for req in filtered:
        counts[req['category']] += 1
    
    booming = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{'service': cat, 'demand': count} for cat, count in booming]


# ─── 6. Business Recommendations ────────────────────────────────────────────

def get_business_recommendations():
    all_recs = {}
    for area in AREAS:
        recs = get_booming_services(area)
        all_recs[area] = [{'service': r['service'], 'opportunity': f"High demand for {r['service']} in {area}"} for r in recs]
    return all_recs


# ─── 7. Price Analytics ─────────────────────────────────────────────────────

def get_price_analytics(area=None):
    filtered = requests_data
    if area and area != 'All':
        filtered = [r for r in filtered if r['area'] == area]
    
    price_stats = {}
    for cat in CATEGORIES:
        prices = [r['price'] for r in filtered if r['category'] == cat]
        if prices:
            price_stats[cat] = {
                'category': cat,
                'avg_price': round(sum(prices) / len(prices), 2),
                'min_price': min(prices),
                'max_price': max(prices)
            }
    
    return list(price_stats.values())


# ─── 8. Predictions ─────────────────────────────────────────────────────────

def get_predictions(area=None):
    # Generate service-specific forecasts based on area-specific demand
    filtered = requests_data
    if area and area != 'All':
        filtered = [r for r in filtered if r['area'] == area]
    
    predictions = []
    for service in CATEGORIES:
        service_requests = [r for r in filtered if r['category'] == service]
        if not service_requests:
            # If no data for this service in the area, use random forecast
            change = round(random.uniform(-0.5, 0.5), 1)
        else:
            # Calculate trend based on actual demand - first half vs second half of year
            mid = len(service_requests) // 2
            first_half_avg = len([r for r in service_requests[:mid]]) / max(1, mid) if mid > 0 else 0
            second_half_avg = len([r for r in service_requests[mid:]]) / max(1, len(service_requests) - mid) if mid < len(service_requests) else 0
            change = round((second_half_avg - first_half_avg) / max(0.1, first_half_avg) * 100, 1) if first_half_avg > 0 else round(random.uniform(-0.5, 0.5), 1)
            change = max(-100, min(100, change))  # Cap between -100 and 100
        
        direction = 'rise' if change >= 0 else 'fall'
        text = f"Demand for {service} expected to {direction} by ~{abs(change)}% next month"
        predictions.append({'text': text, 'service': service, 'change': change, 'month': 'Next'})
    
    return predictions[:5]  # Return top 5 services


# ─── 9. Trust Scores ────────────────────────────────────────────────────────

def get_trust_scores(area=None, category=None):
    filtered = providers_data
    if area and area != 'All':
        filtered = [p for p in filtered if p['area'] == area]
    if category and category != 'All':
        filtered = [p for p in filtered if p['category'] == category]
    
    avg_rating = sum(p['rating'] for p in filtered) / len(filtered) if filtered else 4.5
    return {'avg_trust_score': round(avg_rating * 20, 1)}


# ─── 10. KPI Summary ────────────────────────────────────────────────────────

def get_kpi_summary(area=None, category=None):
    filtered_req = requests_data
    filtered_prov = providers_data
    
    if area and area != 'All' and area != 'All India':
        filtered_req = [r for r in filtered_req if r['area'] == area]
        filtered_prov = [p for p in filtered_prov if p['area'] == area]
    if category and category != 'All':
        filtered_req = [r for r in filtered_req if r['category'] == category]
        filtered_prov = [p for p in filtered_prov if p['category'] == category]
    
    total_requests = len(filtered_req)
    total_providers = len(filtered_prov)
    avg_rating = sum(p['rating'] for p in filtered_prov) / len(filtered_prov) if filtered_prov else 4.5
    avg_price = sum(r['price'] for r in filtered_req) / len(filtered_req) if filtered_req else 1000
    
    return {
        'total_requests': total_requests,
        'total_providers': total_providers,
        'avg_trust_score': round(avg_rating * 20, 1),
        'market_value': round(avg_price, 2)
    }


# ─── 11. Area Insights ──────────────────────────────────────────────────────

def get_area_insights(area=None):
    filtered = requests_data
    if area and area != 'All':
        filtered = [r for r in filtered if r['area'] == area]
    
    insights = []
    for a in AREAS:
        area_data = [r for r in requests_data if r['area'] == a]
        insights.append({
            'area': a,
            'total_demand': len(area_data),
            'growth': round(random.uniform(5, 25), 1)
        })
    
    return sorted(insights, key=lambda x: x['total_demand'], reverse=True)[:10]
