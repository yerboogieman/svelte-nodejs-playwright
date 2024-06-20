# svelte-nodejs-playwright

Svelte JS front end. Node/Express JS back end. Playwright end-to-end tests.

1. **Node/Express JS Back End** - Create a simple REST API using Express JS

   Here is [a simple Express JS tutorial](https://medium.com/@skhans/building-a-restful-api-with-express-js-a-beginners-guide-dcb1a1e3520d)
    that may be of assistance.

| HTTP Method   | URL Pattern           | Description                           |
|---------------|-----------------------|---------------------------------------|
| GET           | /friends/${friend_id} | Gets friend with ID = ${friend_id}    |
| GET           | /friends              | Gets all friends                      |
| POST          | /friends              | Creates a new friend                  |
| PUT           | /friends              | Replaces an existing friend           |
| DELETE        | /friends/${friend_id} | Deletes friend with ID = ${friend_id} |

In order to create/read/update/delete friends from the postgres database, use the following connection parameters in IntelliJ:

- **Host**: dpg-cpotjk1u0jms73ffs5bg-a.oregon-postgres.render.com
- **Port**: 5432
- **Database**: ia_demo
- **Username**: ia_demo
- **Password**: nIEPFe4xfILd4w6ty9XkxdNBRnKpJIR2
- **Connection URL**: jdbc:postgresql://dpg-cpotjk1u0jms73ffs5bg-a.oregon-postgres.render.com:5432/ia_demo


2. **Svelte JS Front End** 