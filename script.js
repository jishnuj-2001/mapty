'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearRoute = document.querySelector('.clear--route-btn')


class workout{
    date = new Date();
    monthNumber = this.date.getMonth();
    day = this.date.getDate();
    id = (Date.now()+'').slice(-10)
    constructor( coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration= duration;
        
    }
    
    
}

class running extends workout{
    constructor( coords, distance , duration, cadence){
        super(coords, distance, duration)
        this.cadence = cadence;
        this.calcPace();
        this.name = 'Running'
        this.class = 'running'
    }

    calcPace(){
        //min/km
        this.pace = this.duration/this.distance;
        return this.pace;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.month = months[this.monthNumber] 
        return  `${this.month} ${this.day}`
    }
    
}
class cycling extends workout{
    constructor( coords, distance , duration, elevationGain){
        super(coords, distance, duration)
        this.elevationGain = elevationGain;
        this.name = 'Cycling'
        this.class = 'cycling'
        this.calcSpeed();
    }
    calcSpeed(){
        this.speed = this.distance  / (this.duration)/60;
        return this.speed;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.month = months[this.monthNumber] 
        return  `${this.month} ${this.day}`
    }
   
}

// const  run1 = new running([34.5,32.6],100,120,20);
// const  cyc1 = new cycling([34.5,32.6],190,90,30);
// console.log(cyc1,run1);

//--------------------------------------------------------------------------------------------------------------------------------------------------
//Architecture
class App{

    #routingControl;
    #route = false;
    #polyline;
    #mapClicks = 0;
    #map;
    #mapEvent;
    #mapZoom = 16;
    #workouts = [];
    #coords1 = [];
    #coords2 = [];
    #marker1 = {};
    #marker;

    constructor(){
        //Get user position
        this._getPosition();
        //Get dat from local storage
        this._getLocalStorage();

        
        // const obj = this;
        // form.addEventListener('submit', function(evt){
        //     evt.preventDefault();
        //     obj._newWorkout();
        // }); 
        form.addEventListener('submit', this._newWorkout.bind(this));   
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        clearRoute.addEventListener('click',this._removeRouting.bind(this))
    }
    

    _getPosition(){
        // console.log(this)
        let coords = [];
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition( ( position)=>{
                const {latitude,longitude} = position.coords;
                coords = [latitude,longitude]
                // this.#currentCoords = [latitude,longitude]
                // console.log(position.coords);
                // console.log(`https://www.google.com/maps/@${latitude},${longitude},12.75z?entry=ttu`);
                this._loadMap(latitude,longitude);
                
            }, function(){
                console.log("Couldnt get current position");
            });
        }
        return coords;
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));
        if(!data) return;
        this.#workouts = data;
        this.#workouts.forEach( work => {
            const [lt,lg] = work.coords
            // console.log(lat,lng);
            this._renderWorkout(work);
            // this._renderWorkoutMarker(work,lt,lg);
        })

    }

    _loadMap(latitude,longitude){
        this.#map = L.map('map').setView([latitude, longitude], this.#mapZoom);
        // console.log(this)
        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        // console.log(this)
        const obj = this
        
        let marker;
    
        this.#map.on('click', function (event) {
            obj.#mapClicks++;
            obj.#mapEvent = event;
            const { lat, lng } = obj.#mapEvent.latlng;
    
            if (obj.#mapClicks === 1) {
                // First click: Add marker
                marker = L.marker([lat, lng]).addTo(obj.#map);
            } else if (obj.#mapClicks === 2) {
                // Second click: Render route, remove marker, and reset click count
                obj._removeRouting();
                obj.#mapClicks = 0;
    
                if (marker) {
                    // Use the coordinates from the first and second clicks
                    const coords1 = [marker.getLatLng().lat, marker.getLatLng().lng];
                    const coords2 = [lat, lng];
    
                    obj.#routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(...coords1),
                            L.latLng(...coords2)
                        ]
                    }).addTo(obj.#map);
    
                    // Directly remove the marker from the map
                    obj.#map.removeLayer(marker);
                }
            }
    
            obj._showForm();
        });
        this.#workouts.forEach( work => {
            const [lt,lg] = work.coords
            // console.log(lat,lng);
            // this._renderWorkout(work);
            this._renderWorkoutMarker(work,lt,lg);
        })
    }
    _removeRouting(){
        if (this.#routingControl != null) {
            
            this.#map.removeControl(this.#routingControl);
            this.#routingControl = null;
        }
    }
    _showForm(){ 
        form.classList.remove('hidden')
        inputDistance.focus();    
    }
    _hideForm(){
        form.style.display = 'none';
        form.classList.add('hidden')
        setTimeout(()=>
            form.style.display  = 'grid'
        ,1000)
    }

    _toggleElevationField(){
        if(inputType.value == 'cycling'){
            inputCadence.closest('.form__row').classList.add('form__row--hidden');
            inputElevation.closest('.form__row').classList.remove('form__row--hidden');
        }else if(inputType.value == 'running'){
            inputElevation.closest('.form__row').classList.add('form__row--hidden');
            inputCadence.closest('.form__row').classList.remove('form__row--hidden');
        }
    }

    _newWorkout(evt){
        evt.preventDefault();
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat,lng} = this.#mapEvent.latlng;
        const inputValid = (...inputs)=> inputs.every( input => Number.isFinite(input))
        
        const  allPositive = (...inputs)=> inputs.every( input =>  input>0);
        let workout;
        
        //if running workout creating running object
        if(type === 'running'){
            const cadence = +inputCadence.value;
            if(!inputValid(distance,duration,cadence)||!allPositive(distance,duration,cadence)){
                return alert('Input have to be positive numbers')                 
            }
            // console.log('Running workout...')
            workout = new running([lat,lng],distance,duration,cadence)
            workout._setDescription();
            this.#workouts.push(workout);
        }
        if(type === 'cycling'){
            console.log('Cycling workout...');
            const elevation = +inputElevation.value;
            if(!inputValid(distance,duration,elevation)||!allPositive(distance,duration)){
                return alert('Input have to be positive numbers')
            }
            workout = new cycling([lat,lng],distance,duration,elevation)
            workout._setDescription();
            this.#workouts.push(workout);
        }
        //if cycling workout creating cycling object
        // console.log(this.#workouts);

        inputDistance.value = inputCadence.value =inputDuration.value = inputElevation.value = '';
        
        this._renderWorkoutMarker(workout,lat,lng);
        this._renderWorkout(workout);
        this._hideForm()
        this._setLocalStorage();
        
    }

    _renderWorkoutMarker(workout,lat,lng){

        L.marker([lat, lng]).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth:100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.class}-popup`,
            
        }))
        .setPopupContent(`${workout.class === 'running'?'🏃':'🚴‍♀️'} ${workout.name} on ${workout.month} ${workout.day}`)
        .openPopup();
    }


    _renderWorkout(workout){
        // console.log(workout);
        let html = `
                 <li class="workout workout--${workout.class}" data-id="${workout.id}">
                    <h2 class="workout__title">${workout.name} on ${workout.month} ${workout.day}</h2>
                    <div class="workout__details">
                        <span class="workout__icon">
                            ${workout.class === 'running'?'🏃':'🚴‍♀️'}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">⏱</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                    </div>`
        // console.log(html);
        if(workout.class === 'running'){
            html+=`
                    <div class="workout__details">
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.pace.toFixed(1)}</span>
                        <span class="workout__unit">min/km</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">🦶🏼</span>
                        <span class="workout__value">${workout.cadence}</span>
                        <span class="workout__unit">spm</span>
                    </div>
                </li>`
        }
        if(workout.class === 'cycling'){
            html+=`
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>`
        }
        form.insertAdjacentHTML('afterend',html)
    }

    _moveToPopup(evt){
        const workoutEl = evt.target.closest('.workout')
        // console.log(workoutEl);
        if(!workoutEl) return;
        workoutEl.dataset.id
        const workout = this.#workouts.find( workout => workout.id === workoutEl.dataset.id)
        // console.log(workout);
        this.#map.setView(workout.coords,this.#mapZoom, {
            animate: true,
            pan: {
                duration: 0.5
            }
        })
    }
    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    reset(){
        localStorage.removeItem('workouts')
        location.reload();
    }
   
}

const  app = new  App();


