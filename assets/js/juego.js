//  2C = two of clubs  (TREBOL)
//  2D = two of DIAMONDS( DIAMANTES)
//  2H = two of HEARTS  ( CORAZONES)
//  2S = two of SPADE  (ESPADA)

let deck = [];
const tipos = ["C", "D", "H", "S"]
const especiales = ["A","J", "Q", "K"]

let puntoJugador = 0;
    puntoComputadora = 0;

//Referencia el Html
const btnPedir            = document.querySelector("#btnPedir");
const divCartaJugardor    = document.querySelector("#jugador-carta");
const divCartacomputadora = document.querySelector("#computadora-carta");
const puntosAcomulados    = document.querySelectorAll("small");
const btnDetener          = document.querySelector("#btnDetener");
const btnNuevo            = document.querySelector( "#btnNuevo");







//esta funcion crea un nuevo deck 
const crearDeck = ()  => {

    for( let i = 2; i<=10 ; i++){
        
       for(let tipo of tipos)
        deck.push(i + tipo)
    

    } 

    for(let tipo of tipos){
       for(let esp of especiales){
        deck.push(esp + tipo)
       }
    }        
deck = _.shuffle(deck)
return deck

}

crearDeck()

// esta funcion me permite tomar una carta

const perdirCarta = () => {

    if (deck.length <= 0){
        throw "No hay cartas en el deck";
    }
    
  const carta = deck.pop()

  

  
  

 return carta   
}

// perdirCarta()

// valor de la carta 

const valorCarta = (carta) => {
    const valor = carta.substring(0, carta.length -1);
   
return (isNaN(valor)) ?
(valor === "A") ? 11 : 10
: valor * 1;

}

//turno de la computadora
const turnoComputadora = (puntosMinimos) => {

    do {
    const carta = perdirCarta()

    puntoComputadora += valorCarta(carta);
    puntosAcomulados[1].innerText = puntoComputadora

    const imgCarta = document.createElement("img");
    imgCarta.classList.add("carta")
    imgCarta.src = `assets/cartas/cartas/${carta}.png`;
    divCartacomputadora.append(imgCarta);
    if(puntosMinimos >21){
        break;
    }
        
    } while ((puntoComputadora < puntosMinimos) && puntosMinimos <= 21);
    
    setTimeout(() => {
     if(puntoComputadora === puntosMinimos)  {alert("nadie Gana")

    }else if(puntosMinimos > 21) { alert ("computadora gana")

    } else if(puntoComputadora > 21)  {alert ("Jugador Gana")

    } else alert("computadora gana")


        
    }, 30);

   
}





//eventos

btnPedir.addEventListener("click", () => {
    const carta = perdirCarta()

    puntoJugador += valorCarta(carta);
    puntosAcomulados[0].innerText = puntoJugador



    //  <img class="carta" src="assets/cartas/cartas/10C.png" alt="10 de corazones">
    
    const imgCarta = document.createElement("img");
    imgCarta.classList.add("carta")
    imgCarta.src = `assets/cartas/cartas/${carta}.png`;
    divCartaJugardor.append(imgCarta);
    
    if(puntoJugador >21 ){
        console.warn("Lo siento mucho, has perdido");
        btnPedir.disabled = true;
        btnDetener.disabled = true;
        turnoComputadora(puntoJugador)
        
    }else if ( puntoJugador === 21 ){
        console.warn("21, Genial!!");
        btnPedir.disabled = true;
        btnDetener.disabled = true;
          turnoComputadora(puntoJugador)
    }
        
    
    
    

});

btnDetener.addEventListener("click", () => {
    btnPedir.disabled = true;
    btnDetener.disabled = true;
    turnoComputadora(puntoJugador)
})

btnNuevo.addEventListener("click", () => {
    deck = [];
    
    deck = crearDeck();
    
    btnDetener.disabled = false;
    btnPedir.disabled = false;

    puntoJugador = 0;
    puntoComputadora = 0;

    puntosAcomulados[1].innerText = 0;
    puntosAcomulados[0].innerText = 0;

    divCartacomputadora.innerHTML = "";
    divCartaJugardor.innerHTML = "";


    
    


})
