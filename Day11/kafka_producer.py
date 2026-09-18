"""
Kafka Producer - Sends messages to 'test-topic'
Run this file FIRST, then run kafka_consumer.py in a separate terminal.
"""

from kafka import KafkaProducer
import time

# Create a Kafka producer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: v.encode('utf-8')
)

print("Kafka Producer started. Type messages and press Enter to send.")
print("Type 'exit' to quit.\n")

while True:
    message = input("Enter message: ")
    if message.lower() == 'exit':
        break
    producer.send('test-topic', value=message)
    producer.flush()
    print(f"  >> Sent: {message}")

producer.close()
print("Producer closed.")
