import requests
import random
from time import sleep, perf_counter

size_list = list(range(1000, 2100, 100))

for i in range(int(1e4)):
    random_width = random.choice(size_list)
    random_height = random.choice(size_list)
    
    url = f'https://some.domain.com/?url=https://picsum.photos/{random_width}/{random_height}'
    start_time = perf_counter()
    resp = requests.get(url)
    end_time = perf_counter()
    print(url, resp.status_code, end_time-start_time)
    sleep(0.05)
