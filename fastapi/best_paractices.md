[15 best practices](https://youtu.be/kmJz8w5ij8Y)
## 1. not to use asyn def for blocking operations like reading from file or sleep or reading from db
- includes http request using requests.get etc
- doing so will freeze the applcaition as fastapi puts asyn in main thread
- if its just def then it will use thread from the pool and not the main thread

## 2. If asyn has to eb used in blocking code then use the right one
- time.sleep => await asyncio.sleep()
- request.get() => async with http.AsyncClient() as client : await client.get()
- client = MongoClient() => client = AsyncIOMotorClient()

## 3. Use fastapi for i/o bound tasks not heavy cpu conputations
- if done, tha applcaition will be frozen till the task is complete
- thumb rule of less than 500ms processing only
- If its heavy and time consuming use fastapi only for valdation of input output and routing to the proper engine that will do the compute
    - in such cases use queue and worker (rabbitmq and celery)
    - Redis can lose messages if it crashes (it's in-memory first). RabbitMQ persists messages to disk by default — so if the broker goes down, jobs aren't lost.
    For most apps Redis is "reliable enough," but RabbitMQ is built specifically for guaranteed delivery.

## 4. The dependencies also decide if it has to be asyn of not based on the heaviness

## 5. dont make user wait by using built in background tasks
- which are not related to the user and for the pplciaiton like logging or send emails that can happen in the bg and user need not wait for it

## 6. dont expose swagger or redocs
- app = FastAPI(dosc_url = None, redoc_url = None)

## 7. Create custom basemodel via pydantic

## 9. Use pydantic for validation of input and output not inside the endpoint
- using types and pydantic fields
- if not there write custom ones in the basemodel

## 10. in db use dependecies to check for conditions
- #what
- FastAPI's dependency injection system.
You define a function that does something (check auth, get DB session, parse headers) and inject it into your route with Depends(your_function) — FastAPI calls it automatically before your route runs.
Common uses: auth checking, database sessions, shared query params.

## 11. dont make db connection at every endpoint call #what
- have it done before in pool and dependcy
- old way : global pool

## 12. Lifespan for app resources instead of on_event startup/shutdown
- #what

## 13. use pydantic basesettings as config
- #what dynaconf

## 14. Strcutred logging not print
- logging/loguru/structlog
- make a loggin middleware

## 15. uviconr in dev and gunicorn in prod, unless k8s
- uvloop in req.txt for perf boost
- workers = (cpucores *2)+1 : can be fine tuned by benchmarking