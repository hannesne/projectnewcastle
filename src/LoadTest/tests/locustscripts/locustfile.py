import random
import json

from locust import TaskSet, task, between, TaskSequence, seq_task
from locust.contrib.fasthttp import FastHttpLocust

from .variables import Variables

# Echo
def Echo(self):
    return self.client.get(
        "echo/resource?param1=sample", 
        headers = {
            "Ocp-Apim-Subscription-Key": Variables.sub_key
        },
        catch_response = True
    )

class EchoTaskSet(TaskSet):
    @task
    def Get(self):
        with Echo(self) as response:
            if response.status_code != 200:
                response.failure(f"Code: {response.status_code} | Content: {response.text}")

class EchoLocust(FastHttpLocust):
    wait_time = Variables.wait_time
    task_set = EchoTaskSet

# All
class AllTaskSet(TaskSet):
    tasks = {
        EchoTaskSet: 1
    }

    @task
    def index(self):
        pass
    
class AllLocust(FastHttpLocust):
    wait_time = Variables.wait_time
    task_set = AllTaskSet
