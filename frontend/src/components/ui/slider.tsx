import * as React from "react";
import {Slider} from "radix-ui";

const CustomSlider = ({value, onValueChange, min, max, step}:{value:number[], min:number, max:number, step:number, onValueChange:(val:number[])=>void},) => (
	<form>
		<Slider.Root onValueChange={onValueChange} className="SliderRoot" defaultValue={value} max={100} step={1}>
			<Slider.Track className="SliderTrack">
				<Slider.Range className="SliderRange" />
			</Slider.Track>
			<Slider.Thumb className="SliderThumb" aria-label="Volume" />
		</Slider.Root>
	</form>
);

export default CustomSlider;

