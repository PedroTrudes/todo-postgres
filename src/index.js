const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const PORT = process.env.PORT || 3333 //setando uma porta, caso nao aja outra no heroku

//conectando com o banco e usando a nossa variavel de ambiente
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
})

//chando o express
const app = express()
//nossa aplicação vai poder usar JSON
app.use(express.json())
app.use(cors)

//Testando uma Rota simples
app.get('/', (req, res) => console.log("Ola Mundo"))

app.get('/users', async (req, res) => {
    try {
       const {rows} = await pool.query('SELECT * FROM users') 
       return res.status(200).send(rows)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.post('/session', async (req, res) =>{
    const { username } = req.body
    let user = ''
    try {
        user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username])
        if(!user.rows[0]){
            user = await pool.query('INSERT INTO users(user_name) VALUES ($1) RETURNING * ', [username])

        }
        return res.status(200).send(user.rows)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.post('/todo/:user_id', async (req, res) =>{
    const {description, done} = req.body
    const {user_id} = req.params
    try {
        const newTodo = await pool.query('INSERT INTO todos (todo_description, todo_dono, user_id) VALUES ($1,$2,$3) RETURNING *', [description, done, user_id])
        return res.status(200).send(newTodo.rows)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.get('/todo/:user_id', async (req, res) => {
    const {user_id} = req.params
    try {
        const allTodos = await pool.query('SELECT * FROM todos WHERE user_id = ($1)', [user_id])
        return res.status(200).send(allTodos.rows)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.patch('/todo/:user_id/:todo_id', async (req, res) => {
    const {todo_id, user_id} = req.params
    const data = req.body
    try {
        const belongsToUser = await pool.query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [ user_id , todo_id])

        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed') 

        const updatedTodo = await pool.query('UPDATE todos SET todo_description = ($1), todo_dono = ($2) WHERE todo_id = ($3) RETURNING *', 
        [data.description, data.done, todo_id])
        res.status(200).send(updatedTodo.rows)
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.delete('/todo/:user_id/:todo_id', async (req, res) =>{
    const { user_id, todo_id } = req.params
    try {
        const belongsToUser = await pool.query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [user_id, todo_id])
        if(!belongsToUser.rows[0]) return res.status(400).send('Não foi possivel apagar esse todo tente novamente')
        const deletedTodo = await pool.query('DELETE FROM todos WHERE todo_id = ($1) RETURNING *', [todo_id])
        return res.status(200).send({
            message: 'Todo deletado com sucesso',
            deletedTodo:  deletedTodo.rows
        })
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.listen(PORT, () => console.log(`Server Teste de Runing ${PORT}`))