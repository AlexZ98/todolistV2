const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = {
  name: String
};

const Item = mongoose.model("item", itemSchema);

const itemOne = new Item({
  name: "Item One"
});
const itemTwo = new Item({
  name: "Item Two"
});
const itemThree = new Item({
  name: "Item Three"
});

const defaultItems = [itemOne, itemTwo, itemThree];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("list", listSchema);


app.get("/", function (req, res) {
  const today = date.getDate();
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: today,
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const pageListName = req.body.list;

  const newestItem = new Item({
    name: itemName
  });
  if (pageListName === "Today") {
    newestItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: pageListName
    }, function (err, foundList) {
      foundList.items.push(newestItem);
      foundList.save();
      res.redirect("/" + pageListName);
    });
  }
});

app.post("/delete", function (req, res) {
  const markedForDelete = req.body.checkbox;
  const currentPageList = req.body.pageName;

  if (currentPageList === "Today") {
    Item.findByIdAndRemove(markedForDelete, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: currentPageList
    }, {
      $pull: {
        items: {
          _id: markedForDelete
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + currentPageList);
      }
    });
  }
});

app.get("/:pageName", function (req, res) {
  const pageName = _.capitalize(req.params.pageName);

  List.findOne({
    name: pageName
  }, function (err, foundList) {
    if (!err) {
      //Null check
      if (!foundList) {
        //Create that list
        const pageList = new List({
          name: pageName,
          items: defaultItems
        });
        pageList.save();
        res.redirect("/" + pageName);
      }
      //Redirect to that existing list
      else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });


});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});