import * as gs from '@gzhangx/googleapi'
import * as fs from 'fs'
import * as db from '../api/lib/db'

function getCreds() {
    const creds: gs.gsAccount.IServiceAccountCreds
    = JSON.parse(fs.readFileSync('d:\\work\\cur\\creds\\gzperm-pmapi-googleSvcAccount-aa12f63bd789.json').toString());
    return creds;
}
async function test() {

    const dbres = await db.findUser({ id: '1' });
    console.log('dbres',dbres);
    const client = gs.gsAccount.getClient(getCreds());
    const ops = client.getSheetOps("13Mu-zB_WicsI3JXcFCLzvYTE-brVqVXnbDzgoIseF34");
    const rows = await ops.readDataByColumnName("MaintainessRecord");
    console.log(rows);
}

test();