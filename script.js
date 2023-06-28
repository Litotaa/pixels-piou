const colorsChoice = document.querySelector('#colorsChoice')
const game = document.querySelector('#game')
const cursor = document.querySelector('#cursor')
game.width = 2000
game.height = 600
const gridCellSize = 10

let pixels_dict = {};
let cooldown = 0;


const ctx = game.getContext('2d');
const gridCtx = game.getContext('2d');

const colorList=[
    "#FFEBEE", "#FCE4EC", "#F3E5F5", "#B39DDB", "#9FA8DA", "#90CAF9", "#81D4F4", "#80DEEA",
    "#4DB6AC", "#66BB6A", "#9CCC65", "#CDDC39","#FFEB3B", "#FFC107", "#FF9800", "#FF5722",
    "#A1887F", "#E0E0E0", "#90A4AE", "#000", "#FFFFFF"
]
let currentColorChoice = colorList[9]

colorList.forEach(color=> {
    const colorItem = document.createElement('div')
    colorItem.style.backgroundColor = color
    colorsChoice.appendChild(colorItem)

    colorItem.addEventListener('click', () =>{
        currentColorChoice = color

        colorItem.innerHTML = `<i class="fa-solid fa-check"></i>`

        setTimeout(()=> {
            colorItem.innerHTML=""
        }, 1000)
    })

})

function createPixel(x, y, color, pseudo){
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(x, y,gridCellSize, gridCellSize)
    pixels_dict[x + "_" + y] = {"pseudo": pseudo}
}

function addPixelIntoGame(){
    if (cooldown > 0){
        return
    }
    const x = cursor.offsetLeft
    const y = cursor.offsetTop - game.offsetTop
    createPixel(x, y, currentColorChoice, sessionStorage.getItem("pseudo"))

    cooldown = 10
    document.getElementById("cooldown").innerHTML = 10;
    var cooldownTimer = setInterval(function(){
        cooldown -= 1;
        if(cooldown <= 0){
            clearInterval(cooldownTimer);
            cooldown = 0;
        }
        document.getElementById("cooldown").innerHTML = cooldown;
    }, 1000);

    $.ajax({
        url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/dev/pixels",
        type: "PUT",
        dataType: 'json',
        crossDomain: true ,
        contentType:'application/json',
        async:true,
        data: JSON.stringify({"x": x, "y": y, "color": currentColorChoice, "pseudo": sessionStorage.getItem("pseudo")}),
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status == 403){
                alert("Cooldown en cours")
                ctx.beginPath()
                ctx.fillStyle = "#FFFFFF"
                ctx.fillRect(x, y,gridCellSize, gridCellSize)
                delete pixels_dict[x + "_" + y]
            }
        }
    })

}
cursor.addEventListener('click', function(event){
    addPixelIntoGame()
})
game.addEventListener('click', function(){
    addPixelIntoGame()
})

function drawGrids(ctx, width, height, cellWidth, cellHeight){
    ctx.beginPath()
    ctx.strokeStyle = "#ccc"

    for(let i = 0; i < width; i++){
        ctx.moveTo(i*cellWidth, 0)
        ctx.lineTo(i*cellWidth,height)
    }

    for(let i = 0; i < height; i++){
        ctx.moveTo(0, i*cellHeight)
        ctx.lineTo(width, i*cellHeight)
    }

    ctx.stroke()

    $.ajax({
        url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/dev/pixels",
        dataType: 'json',
        crossDomain: true,
        contentType:'application/json',
        async:true,
        success: function (response) {
            response.forEach(function(pixel){
                createPixel(pixel['x'], pixel['y'], pixel['color'], pixel["pseudo"])
            })
        },
    })

    setInterval(function(){ 
        $.ajax({
            url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/dev/pixels",
            dataType: 'json',
            crossDomain: true,
            contentType:'application/json',
            async:true,
            success: function (response) {
                response.forEach(function(pixel){
                    createPixel(pixel['x'], pixel['y'], pixel['color'], pixel["pseudo"])
                })
            },
        })
    }, 1000);
}



game.addEventListener('mousemove', function(event){
    const cursorLeft = event.pageX - (cursor.offsetWidth/2)
    const cursorTop = event.pageY - (cursor.offsetHeight/2) - game.offsetTop

    if (cursorTop < 0){
        cursorTop = 0
    }

    cursor.style.left = Math.floor(cursorLeft/gridCellSize)*gridCellSize +"px"
    cursor.style.top = game.offsetTop + Math.floor(cursorTop/gridCellSize)*gridCellSize +"px"

    const x = cursor.offsetLeft
    const y = cursor.offsetTop - game.offsetTop

    var key = x + "_" + y
    var tooltip = document.querySelector('#pixel_pseudo');
    if (key in pixels_dict){
        tooltip.innerHTML = pixels_dict[key]["pseudo"]
        tooltip.style.display = "block";
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top =  event.clientY + 'px';
    }
    else{
        tooltip.style.display = "none";
    }
})


let pseudo = sessionStorage.getItem("pseudo");
if (pseudo == null){
    $('<form>Quel est ton pseudo ?<input type="text" style="z-index:10000" name="name"><br></form>').dialog({
        modal: true,
        buttons: {
            'OK': function () {
                pseudo = $('input[name="name"]').val();
                sessionStorage.setItem("pseudo", pseudo);
                $('#welcome').html('Welcome, ' + pseudo)
                drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize)
                $(this).dialog('close');
            }
        }
    });
}
else{
    $('#welcome').html('Welcome back, ' + pseudo)
    drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize)
}

// sessionStorage.setItem("key", "value");

// $.ajax({
//     url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/dev/users",
//     dataType: 'json',
//     crossDomain: true ,
//     contentType:'application/json',
//     async:true,
//     success: function (response) {
//         $('#welcome').html('Welcome back, ' + response["pseudo"])
//         drawGrids(gridCtx,game.width, game.height, gridCellSize, gridCellSize)
//     },
//     error: function (xhr, ajaxOptions, thrownError) {
//         $('<form>Quel est ton pseudo ?<input type="text" style="z-index:10000" name="name"><br></form>').dialog({
//             modal: true,
//             buttons: {
//                 'OK': function () {
//                     var pseudo = $('input[name="name"]').val();
//                     $.ajax({
//                         url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/dev/users",
//                         type: "PUT",
//                         dataType: 'json',
//                         crossDomain: true ,
//                         contentType:'application/json',
//                         async:true,
//                         data: JSON.stringify({"pseudo": pseudo}),
//                         success: function (response) {
//                             $('#welcome').html('Welcome, ' + pseudo)
//                             drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize)
//                         },
//                     })
//                     $(this).dialog('close');
//                 }
//             }
//         });
//     }
// })



