const fs = require("fs");
const pg = require("pg");
const axios = require("axios");

const config = {
    connectionString:
        "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
    ssl: {
        rejectUnauthorized: true,
        ca: fs
            .readFileSync("/home/user/.postgresql/root.crt")
            .toString(),
    },
};

async function createTable() {
    const conn = new pg.Client(config);
    try {
        await conn.connect();

        const dropTableQuery = `DROP TABLE IF EXISTS characters_vladislav;`;
        await conn.query(dropTableQuery);

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS characters_vladislav (
                id serial primary key,
                name text,
                data jsonb
            );
        `;
        await conn.query(createTableQuery);
    }catch (err) {
        console.error("Error creating:", err.message);
    }finally {
        console.log("Table was created" + "\n");
        await conn.end();
    }
}

async function sizeBase(){  //текущее количество персонажей в базе
    try{
        const length = await axios.get("https://rickandmortyapi.com/api/character/")
            .then(response => {
                return response.data.info.count
            })
            .catch(err => {
                console.error(err.message);
            }) 
        return length
    }catch (err) {
        console.error("Error check size table:",err.message);
    }
}

async function fillTable() {
    try {
        const sizeTable = await sizeBase();
        const arrNumChar = [...Array(sizeTable)].map((_,i) => i + 1);
        let AllCharArr = await axios.get("https://rickandmortyapi.com/api/character/"+arrNumChar)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.error("Error filling the table:",error.message);
        })
        for (let numChar=0; numChar<sizeTable; numChar++){
            let name = AllCharArr[numChar].name;
            let data = JSON.stringify(AllCharArr[numChar]);
            await sendToBase([name,data]);
            console.log(`Character number ${numChar+1} has been loaded`);
        }
    }catch (err) {
        console.error("Error fill the table:",err.message);
    }
}

async function sendToBase(array) {
    const conn = new pg.Client(config);
    try{
        await conn.connect();
        const InsertQuery = `insert into characters_vladislav(name,data) values ($1,$2);`;
        await conn.query(InsertQuery,array);
    }catch(err){
        console.error(err.message);
    }finally{
        await conn.end();
    }
}

async function main() {
    await createTable();
    await fillTable();
}
main();