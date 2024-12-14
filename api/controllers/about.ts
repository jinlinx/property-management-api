import * as fs from 'fs';
import { Request, Response } from 'restify'
async function version(req: Request, res:Response) {
    const date = new Date();
    const verObj = fs.readFileSync('../../version.json').toString();
    const ver = JSON.parse(verObj);
    console.log(`version ${date}`);
    return res.send(ver);    
}

module.exports = {   
    version,
};