class Routing{
    routes(app)
    {
        const shipmentlistData=require("./Routes/ShippmentScnnaing/ShippmentscanRoute");
        const loginRoute=require("./Routes/Login/LoginRoute");
        const dispatchreportRoute=require("./Routes/Reports/DispatchreportRoute");
        app.use("/",dispatchreportRoute);
        app.use("/",shipmentlistData);
        app.use("/",loginRoute);

    }
}
module.exports=new Routing();