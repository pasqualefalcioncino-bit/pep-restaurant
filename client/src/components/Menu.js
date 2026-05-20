import { useEffect, useState } from "react";
import API from "../api";

function Menu() {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await API.get("/menu");
        setMenu(res.data);
      } catch (err) {
        console.log("Errore caricamento menu");
      }
    };

    fetchMenu();
  }, []);

  return (
    <div>
      <h2>🍝 Menu del Ristorante</h2>

      {menu.map((item) => (
        <div key={item.id} style={{ border: "1px solid black", margin: 10, padding: 10 }}>
          <h3>{item.name}</h3>
          <p>€ {item.price}</p>
          <p>{item.category}</p>
        </div>
      ))}
    </div>
  );
}

export default Menu;