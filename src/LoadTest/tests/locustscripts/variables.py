import random
import string

from locust import between

class Variables:
    sub_key = ""

    wait_time = between(1, 5)
