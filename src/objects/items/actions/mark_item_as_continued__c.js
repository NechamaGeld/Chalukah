init();

async function init() {
  try {

    let procceed = await Modal.confirm({
              msg: "All 3 items in different price ranges will be continued. Procceed?",
              yes: "Yes",
              no: "No",
            });
    if(!procceed) return;

    let { data } = await $http.post('/v2/crud/items/read', {
      "query": { " link": record.link }
    });

    if (data && data.length === 3) {
      for (let item of data) {
        await $http.post('/v2/crud/items/update', {
          "data": {
            "id": item.id,
            "discontinued": null
          }
        });
      }
      notify({ message: "All 3 Items of different price ranges where marked as continued" });
      
      $location
          .path('/view/items')
          .search({ _filters: '{"discontinued_3":"include","ignoreSetting":true}' });

        window.location.reload();
    } else {
      notify({ message: "Error finding all 3 items to mark as continued" });
    }
  } catch (err) {
    console.error("Error in init():", err);
    notify({ message: "Items were NOT marked as continued" });
  }
}
