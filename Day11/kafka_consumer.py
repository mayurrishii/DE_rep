"""
Kafka Consumer - Reads messages from 'test-topic'
Run kafka_producer.py FIRST in one terminal, then run this in a separate terminal.
"""

from kafka import KafkaConsumer

# Create a Kafka consumer
consumer = KafkaConsumer(
    'test-topic',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',       # Read from beginning
    enable_auto_commit=True,
    value_deserializer=lambda v: v.decode('utf-8')
)

print("Kafka Consumer started. Listening for messages on 'test-topic'...")
print("Press Ctrl+C to stop.\n")

try:
    for message in consumer:
        print(f"  << Received: {message.value}  [partition={message.partition}, offset={message.offset}]")
except KeyboardInterrupt:
    print("\nConsumer stopped.")
finally:
    consumer.close()
