export function initRestauranteDemo() {
  const restDemo = document.querySelector('.restaurante-demo');
  if (!restDemo) return; // Si no estamos en la página del restaurante, no hace nada.

  // --- 1. HEADER Y TOPBAR AL HACER SCROLL ---
  const header = document.getElementById('restHeader');
  const topbar = document.querySelector('.rest-topbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('rest-header--scrolled');
      if (topbar) topbar.style.display = 'none'; // Ocultamos la topbar al bajar
    } else {
      header.classList.remove('rest-header--scrolled');
      if (topbar) topbar.style.display = 'flex'; // Mostramos la topbar al subir
    }
  });

  // --- 2. SLIDER HERO (Fade automático) ---
  const slides = document.querySelectorAll('.rest-hero__slide');
  let currentSlide = 0;
  
  if (slides.length > 0) {
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000);
  }

  // --- 3. PESTAÑAS DEL MENÚ (Clonación de la tarjeta) ---
  const tabs = document.querySelectorAll('.rest-tab');
  const menuGrid = document.getElementById('menuGrid');
  
  // Datos del menú
  const menuData = {
    main: [
      { nombre: "Braised Chicken Legs", precio: "$34.00", precioAntiguo: "$40.00", img: "/assets/img/restaurante/plato-1.jpg" },
      { nombre: "Bone Steak", precio: "$18.00", precioAntiguo: "$25.00", img: "/assets/img/restaurante/plato-2.jpg" },
      { nombre: "Fish Tacos", precio: "$12.00", precioAntiguo: "$18.00", img: "/assets/img/restaurante/plato-3.jpg" }
    ],
    desserts: [
      { nombre: "Chocolate Cake", precio: "$8.00", precioAntiguo: "$12.00", img: "/assets/img/restaurante/plato-2.jpg" },
      { nombre: "Cheesecake", precio: "$9.00", precioAntiguo: "$15.00", img: "/assets/img/restaurante/plato-2.jpg" },
      { nombre: "Tiramisu", precio: "$10.00", precioAntiguo: "$14.00", img: "/assets/img/restaurante/plato-2.jpg" }
    ],
    seafood: [
      { nombre: "Salmon Fry", precio: "$34.00", precioAntiguo: "$38.00", img: "/assets/img/restaurante/plato-3.jpg" },
      { nombre: "Pangasius or Basa", precio: "$18.00", precioAntiguo: "$25.00", img: "/assets/img/restaurante/plato-3.jpg" },
      { nombre: "Spicy Stuffed Clams", precio: "$12.00", precioAntiguo: "$18.00", img: "/assets/img/restaurante/plato-3.jpg" }
    ],
    beverage: [
      { nombre: "Red Wine", precio: "$15.00", precioAntiguo: "$20.00", img: "/assets/img/restaurante/plato-1.jpg" },
      { nombre: "Craft Beer", precio: "$6.00", precioAntiguo: "$9.00", img: "/assets/img/restaurante/plato-1.jpg" },
      { nombre: "Cocktail", precio: "$12.00", precioAntiguo: "$16.00", img: "/assets/img/restaurante/plato-1.jpg" }
    ]
  };

  // El "molde" de la tarjeta viene desde el Pug (está oculto)
  const tarjetaMolde = document.querySelector('.rest-plato-card');

  function renderMenu(category) {
    menuGrid.innerHTML = ''; // Limpiamos el grid
    
    menuData[category].forEach(plato => {
      // Clonamos el molde
      const nuevaTarjeta = tarjetaMolde.cloneNode(true);
      
      // Le inyectamos los datos
      nuevaTarjeta.querySelector('.rest-plato-card__img').style.backgroundImage = `url('${plato.img}')`;
      nuevaTarjeta.querySelector('.rest-plato-card__title').textContent = plato.nombre;
      nuevaTarjeta.querySelector('.new-price').textContent = plato.precio;
      nuevaTarjeta.querySelector('.old-price').textContent = plato.precioAntiguo;
      
      // Quitamos el display:none que usamos para ocultar el molde original
      nuevaTarjeta.style.display = 'flex'; 
      
      // Lo añadimos al contenedor
      menuGrid.appendChild(nuevaTarjeta);
    });
  }

  // Iniciar
  if (menuGrid && tarjetaMolde) {
    tarjetaMolde.style.display = 'none'; // Ocultar el molde original
    renderMenu('main');
  }

  // Eventos de las pestañas
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMenu(tab.dataset.target);
    });
  });
}