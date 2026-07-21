init();

async function init() {
  try {
    let procceed = await Modal.confirm({
              msg: "All 3 items in different price ranges will be discontinued. Procceed?",
              yes: "Yes",
              no: "No",
            });
    if(!procceed) return;
    
    
    let { data } = await $http.post('/v2/crud/items/read', {
      "query": { " name": record.name }
    });

    if (data && data.length === 3) {
      for (let item of data) {
        await $http.post('/v2/crud/items/update', {
          "data": {
            "id": item.id,
            "discontinued": true
          }
        });
      }
      notify({ message: "All 3 Items of different price ranges where marked as discontinued" });
     
      $location
          .path('/view/items')
          .search({ _filters: '{"discontinued_3":"include","ignoreSetting":true}' });

        window.location.reload();
        //window.location.href = '/#/view/items?_filters=%7B"discontinued_3":"include","ignoreSetting":true%7D';

    } else {
      notify({ message: "Error finding all 3 items to mark as discontinued" });
    }
  } catch (err) {
    console.error("Error in init():", err);
    notify({ message: "Items NOT marked as discontinued" });
  }
}
