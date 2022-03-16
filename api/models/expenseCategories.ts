import { IDBModel } from './types';
export const expenseCategories = {
    fields:
        [
            { field: 'expenseCategoryID', desc: 'Id' , required: true, isId: true},
            { field: 'expenseCategoryName', desc: 'date' },
            { field: 'displayOrder', type:'int' }, 
        ]
} as IDBModel;