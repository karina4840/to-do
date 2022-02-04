const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const _ = require('lodash');
// ========================================================

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
mongoose.connect('mongodb+srv://admin-karina:112545@cluster0.gbw5o.mongodb.net/todoListDB');

// ========================================================

// new schema
const newItems = {
  name: String
};
// new model
const Item = mongoose.model('Item', newItems)

const item1 = new Item({
  name: 'Welcome to your To Do list!'
});

const item2 = new Item({
  name: 'Click the + button to add a new item'
});

const item3 = new Item({
  name: '<-- Hit this to remove an item'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [newItems]
}

const List = mongoose.model('List', listSchema);

// ========================================================
// ===============default route============================

app.get('/', function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      // inserting default items
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log('error occured');
        } else {
          console.log('successfully saved to DB!');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }
  });
});

app.post('/', function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  // check if new items come from a different list
  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  };
});

app.post('/delete', function (req, res) {
  const checketItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checketItem, function (err) {
      if (!err) {
        console.log('successfully deleted from DB.');
        res.redirect('/');
      };
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checketItem
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect('/' + listName)
      }
    })
  }
});

// ===============custom route============================

app.get('/:customName', function (req, res) {
  const customName = _.capitalize(req.params.customName);

  List.findOne({
    name: customName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // creating a new list
        const list = new List({
          name: customName,
          items: defaultItems
        });

        list.save();
        res.redirect('/' + customName)
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      };
    };
  });
});

// ========================================================

app.get('/about', function (req, res) {
  res.render('views/about.ejs');
});

// ====================port================================

app.listen(process.env.MONGODB_URI || 3000, function () {
  console.log('Server started on port 3000.');
});