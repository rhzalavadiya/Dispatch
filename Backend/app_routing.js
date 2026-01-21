class Routing{
    routes(app)
    {
        const shipmentlistData=require("./Routes/ShippmentScnnaing/ShippmentscanRoute");
        const loginRoute=require("./Routes/Login/LoginRoute");
        app.use("/",shipmentlistData);
        app.use("/",loginRoute);

    }
}
module.exports=new Routing();