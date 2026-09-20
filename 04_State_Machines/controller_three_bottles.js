// Código Javascript 

function setup(){
	controlador_2 = 2;
	t = new Timer(0);
}

function controlar(){
	/////////////////////////////// MEF para controlador_2
	switch (controlador_2) {
		case 2:
			YV=0; YA=0; Y1=0; Y2=0; Y3=0; YM=0
			if (Start && XV){controlador_2=3;t.set(0);C=0}
			if (Start && !XV){controlador_2=6;t.set(0)}
			break;
		case 3:
			YV = 0; YA=1; Y1=0; Y2=0; Y3=0; YM=0
			if (!XV && XA){controlador_2=10;t.set(0)}
			if (Stop){controlador_2=2;}
			break;
		case 6:
			YV=1; YA=0; Y1=0; Y2=0; Y3=0; YM=0
			if (XV && !XA){controlador_2=3;t.set(0);C=0}
			if (Stop){controlador_2=2;}
			break;
		case 10:
			YV=0; YA=0; Y1=1; Y2=0; Y3=0; YM=1
			if (X1==1){controlador_2=21;t.set(0)}
			if (Stop){controlador_2=2;}
			break;
		case 15:
			YV=0; YA=0; Y1=0; Y2=0; Y3=1; YM=1
			if ((t.get()>=4)){controlador_2=17;t.set(0)}
			if (Stop){controlador_2=2;}
			break;
		case 17:
			YV=0; YA=0; Y1=0; Y2=0; Y3=0; YM=1
			if ((t.get()>=2)){controlador_2=19;t.set(0)}
			if (Stop){controlador_2=2;}
			break;
		case 19:
			YV=1; YA=0; Y1=0; Y2=0; Y3=0; YM=0
			if (Stop){controlador_2=2;}
			if (XV && !XA){controlador_2=3;C=C+1}
			if (C>=3){controlador_2=2;t.set(0)}
			break;
		case 21:
			YV = 0; YA=0; Y1=0; Y2=1; Y3=0; YM=1
			if (X2==1){controlador_2=15;t.set(0)}
			if (Stop){controlador_2=2;}
			break;
	}
}

function loop(){
	medir();
	controlar();
	actuar();
}

function medir(){
    Start = digitalRead(32);
    Stop = digitalRead(33);
    X1 = digitalRead(35);
    X2 = digitalRead(34);
    XV = digitalRead(36);
    XA = digitalRead(37);
}

function actuar(){
    digitalWrite(22, YA);
    digitalWrite(23, YV);
    digitalWrite(24, Y1);
    digitalWrite(25, Y2);
    digitalWrite(26, Y3);
    digitalWrite(27, YM);
}
  