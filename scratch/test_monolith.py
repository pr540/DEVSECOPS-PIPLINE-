import sys, os; sys.path.append(os.path.join(os.getcwd(), 'api')); import index as api
print("Neural API Monolith Check: START")
try:
    print(f"Engine Type: {api.DATABASE_URL.split(':')[0]}")
    print(f"API Handler: {api.handler}")
    print("Neural API Monolith Check: SUCCESS")
except Exception as e:
    print(f"Neural API Monolith Check: FAILED - {e}")
    exit(1)
