read();
async function read() {
    console.log("in here");
    let { data } = await $http.post('/v2/crud/projects/read', { query: {} });
    console.log("projects are", data);
}