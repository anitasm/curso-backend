const AppError = require('../../src/errors/AppError');
const ProductsService = require('../../src/services/products.service');
const UsersService = require('../../src/services/users.service');
const CartsService = require('../../src/services/carts.service');
const validProduct = { title: 'Aro Rina', description: 'Acero', price: 100, stock: 2, category: 'Accesorios' };
function fixtures() {
  let sequence = 1;
  const nextId = () => (sequence++).toString(16).padStart(24, '0');
  const products = new Map(), users = new Map(), carts = new Map();
  const create = (map, data) => { const id = nextId(); const row = {...data, id, _id:id}; map.set(id,row); return row; };
  const update = (map,id,data) => { if (!map.has(id)) return null; const row={...map.get(id),...data}; map.set(id,row); return row; };
  const remove = (map,id) => { const row=map.get(id); map.delete(id); return row; };
  const paginate = (rows,{page,limit}) => {
    const totalPages=Math.max(1,Math.ceil(rows.length/limit));
    return { docs:rows.slice((page-1)*limit,page*limit),page,totalPages,hasPrevPage:page>1,hasNextPage:page<totalPages,prevPage:page>1?page-1:null,nextPage:page<totalPages?page+1:null };
  };
  const productsRepository = {
    getProducts: async options => {
      let rows=[...products.values()];
      if (options.query === 'true' || options.query === 'false') rows=rows.filter(row=>row.status===(options.query==='true'));
      else if (options.query) rows=rows.filter(row=>row.category.toLowerCase()===options.query.toLowerCase());
      if (options.sort) rows.sort((a,b)=>(a.price-b.price)*(options.sort==='asc'?1:-1));
      return options.paginate ? paginate(rows,options) : rows;
    },
    getProductById:async id=>products.get(id), createProduct:async data=>create(products,data),
    updateProduct:async (id,data)=>update(products,id,data), deleteProduct:async id=>remove(products,id),
  };
  const uniqueEmail = (data,id) => { if ([...users.values()].some(row=>row.email===data.email && row.id!==id)) throw new AppError(409,'Email duplicado','DUPLICATE_KEY'); };
  const usersRepository = {
    list:async options=>paginate([...users.values()],options),get:async id=>users.get(id),
    create:async data=>{uniqueEmail(data);return create(users,data);},
    update:async (id,data)=>{uniqueEmail(data,id);return update(users,id,data);},remove:async id=>remove(users,id),
  };
  const populated = id => { const cart=carts.get(id); return cart ? {...cart,products:cart.products.map(item=>({...item,product:products.get(item.product)||null}))}:null; };
  const cartsRepository = {
    createCart:async ()=>create(carts,{products:[]}), getCartById:async id=>populated(id),
    addProductToCart:async (cid,pid)=>{const cart=carts.get(cid);if(!cart)return null;const item=cart.products.find(item=>item.product===pid);if(item)item.quantity++;else cart.products.push({product:pid,quantity:1});return populated(cid);},
    removeProductFromCart:async (cid,pid)=>{const cart=carts.get(cid);if(!cart)return null;cart.products=cart.products.filter(item=>item.product!==pid);return populated(cid);},
    updateCartProducts:async (cid,items)=>{if(!carts.has(cid))return null;carts.get(cid).products=items;return populated(cid);},
    updateProductQuantityInCart:async (cid,pid,quantity)=>{const cart=carts.get(cid);if(!cart)return null;const item=cart.products.find(item=>item.product===pid);if(!item)return false;item.quantity=quantity;return populated(cid);},
    clearCart:async cid=>{if(!carts.has(cid))return null;carts.get(cid).products=[];return populated(cid);},
  };
  const productsService=new ProductsService(productsRepository);
  return {productsService,usersService:new UsersService(usersRepository),cartsService:new CartsService(cartsRepository,productsService),productsRepository,usersRepository,cartsRepository};
}
module.exports={fixtures,validProduct};
