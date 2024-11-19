import gs from '@gzhangx/googleapi'
import * as fs from 'fs'

function getCreds() {
    const creds: gs.gsAccount.IServiceAccountCreds
    = JSON.parse(fs.readFileSync('c:\\work\\creds\\gzperm-pmapi-googleSvcAccount-aa12f63bd789.json').toString());
    return creds;
}
async function test() {
    const client = gs.gsAccount.getClient(getCreds());
    const ops = client.getSheetOps("13Mu-zB_WicsI3JXcFCLzvYTE-brVqVXnbDzgoIseF34");
    const rows = await ops.readDataByColumnName("MaintainessRecord");
    console.log(rows);
}

test();