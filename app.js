const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { acceptsCharset } = require("express/lib/request");
const { all } = require("express/lib/application");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1/todolistDB");

const todolistSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", todolistSchema);

const item1 = new Item({
  name: "Welcome to your todolist",
});

const item2 = new Item({
  name: "<Write someting>",
});

const item3 = new Item({
  name: "<Click on + icon to save>",
});

const defaultarr = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [todolistSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  const foundUser = await Item.find({});
  if (foundUser.length == 0) {
    Item.insertMany(defaultarr)
      .then(function (db) {
        console.log("Successfully inserted");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundUser });
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", async function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    const val = await Item.findByIdAndRemove(itemId);
    await Item.findById(val._id);
    console.log("Deleted => " + val.name);
    res.redirect("/");
  } else {
    const val = List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemId } } }
    )
      .then(function (updatedList) {
        console.log("Deleted => " + val.name);
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  if(customListName === "About"){
    res.render("About");
  }
  else{
  //console.log("current route Name: " + customListName);
  const queryResult = JSON.parse(
    JSON.stringify(await List.findOne({ name: customListName }))
  );
  // console.log(queryResult);
  // console.log(JSON.parse(JSON.stringify(queryResult)));

  if (queryResult == null) {
    const list = new List({
      name: customListName,
      items: defaultarr,
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", { listTitle: queryResult.name, newListItems: queryResult.items });
  }
}
});



app.listen(3000, function () {
  console.log("Server started on port 3000");
});

// mongoose.connection.close().then(function(op){
//   console.log(op);
//   console.log("Succesfully closed the mongo connection!");
// })
