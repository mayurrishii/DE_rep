# from pyspark.sql import SparkSession

# spark = (
#     SparkSession.builder
#     .master("local[*]")
#     .appName("First Spark App")
#     .getOrCreate()
# )

# df = spark.createDataFrame(
#     [
#         ("Alice", 25),
#         ("Bob", 30),
#         ("Charlie", 28),
#     ],
#     ["Name", "Age"],
# )

# df.show()

# spark.stop()

x = [1,2,3]
y=x
y.append(4)
print(x)