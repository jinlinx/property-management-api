import { set, get, orderBy } from 'lodash';


export type PrimaryKeyTypes = 'db' | 'new';
export interface ICompareOpts<T> {
    dbData: T[];
    newData: T[];
    getPrimaryKey: (data: T, who: PrimaryKeyTypes) => string;
    computeDiff: (dbData: T, newData: T) => number;
}


export interface IDataMatchTo<T> {
    matchedTo: IDataMatchTo<T> | null;
    matchScore: number;
    done: boolean;
    data: T;
}
interface IDbItemsByKey<T> {
    [name: string]: IDataMatchTo<T>[];
}

interface IMatchedData<T> {
    dbData: IDataMatchTo<T>[];
    newData: IDataMatchTo<T>[];
}
interface IKeyCompares<T> {
    [name: string]: IMatchedData<T>;
}

export function compareAndMatchData<T>(opts: ICompareOpts<T>): IDataMatchTo<T>[] {
    const existingKeys = opts.dbData.reduce<IDbItemsByKey<T>>((acc, data) => {
        const pk = opts.getPrimaryKey(data, 'db');

        let ary = acc[pk];
        if (!ary) {
            ary = [];
            acc[pk] = ary;
        }
        ary.push({
            matchedTo: null,
            matchScore: -1,
            data,
            done: false,
        });
        return acc;
    }, {});

    opts.newData = orderBy(opts.newData, ['date'], ['asc']);
    const newKeys = opts.newData.reduce<{
        dict: IKeyCompares<T>;
        ary: IMatchedData<T>[];
        wrapped: IDataMatchTo<T>[];
    }>((acc, nData) => {
        const pk = opts.getPrimaryKey(nData, 'new');
        let cmp = acc.dict[pk];
        if (!cmp) {
            cmp = {
                dbData: existingKeys[pk],
                newData: [],
            };
            acc.dict[pk] = cmp;
            acc.ary.push(cmp);
        }
        const wrapped: IDataMatchTo<T> = {
            data: nData,
            matchedTo: null,
            matchScore: -1,
            done: false,
        };
        cmp.newData.push(wrapped);
        acc.wrapped.push(wrapped);
        return acc;
    }, {
        dict: {},
        ary: [],
        wrapped: [],
    });

    newKeys.ary.forEach(pair => {
        if (!pair.dbData) {
            //no pk match, all done
            pair.newData.forEach(nd => nd.done = true);
        } else {
            let notMatchedNewData = [...pair.newData];
            let notmatchedDbData = [...pair.dbData];
            while (true) {                
                notMatchedNewData.map(nd => {
                    notmatchedDbData.forEach(db => {
                        const score = opts.computeDiff(db.data, nd.data);                        
                        //console.log('got score', score, db.matchScore)
                        if (db.matchScore < score) {                            
                            db.matchedTo = nd;
                            nd.matchedTo = db;
                            db.matchScore = score;
                            nd.matchScore = score;
                            console.log('got score', score, nd, db)
                        }
                    })
                });
                notMatchedNewData = notMatchedNewData.filter(n => {                    
                    if (n.matchedTo?.matchedTo === n) {
                        console.log('dbgrm n.matchedTo?matchedTo equal ', notmatchedDbData.length, n.matchedTo)
                        notmatchedDbData = notmatchedDbData.filter(x => x !== n.matchedTo);
                        n.done = true;
                        return false;
                    } else {
                        return true;
                    }
                });
                if (!notmatchedDbData.length) {
                    notMatchedNewData.forEach(nd => nd.done = true);
                    break;
                }
                if (!notMatchedNewData.length) break;
            }
        }
    });


    return newKeys.wrapped;
}