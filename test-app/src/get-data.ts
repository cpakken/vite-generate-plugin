export default async () => {
  return await fetch('https://jsonplaceholder.typicode.com/todos/2').then((r) => r.json())
}
