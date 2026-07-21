Modal.confirm(`Are you sure you want to delete ${record.length} deliveries?`)
.then(async () => {
    const logs = [];

    for (let d of record) {
        try {
            var res = await $http.get("projects/deliveries/delete/" + d.id);
            logs.push(res);
        } catch (ex) {
            logs.push({ ex });
        }
    }

    notify({
        message: `${logs.filter(l => !l.ex).length} out of ${record.length}
    deliveries deleted successfully`
    })

    console.log(logs);

    scope.refreshInfo()
})