import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useForm, Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import * as RadixForm from '@radix-ui/react-form';
import * as RadixSlider from '@radix-ui/react-slider';
import "../styles/OptimizationForm.css"

type City = {x:number, y:number};

interface OptimizationFormData {
  problem_type: string;
  population_size: number;
  dimension: number;
  mutation_rate: number;
  crossover_rate: number;
  max_generations: number;
  parameters: {
    cities: City[];
  };
}

interface OptimizationFormProps {
  onSubmit: SubmitHandler<OptimizationFormData>; // Use SubmitHandler from react-hook-form
  isRunning: boolean;
  problemType: string;
}

const OptimizationForm: React.FC<OptimizationFormProps> = ({ onSubmit, isRunning, problemType }) => {
  const form = useForm<OptimizationFormData>({
    defaultValues: {
      problem_type: problemType,
      population_size: 10,
      mutation_rate: 0.1,
      crossover_rate: 0.5,
      max_generations: 10,
      parameters: {
        cities: [
          {x:0, y:0}, {x:1, y:3}, {x:2, y:1}, {x:3, y:9}, {x:5, y:3},
        ] as City[],
      },
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "parameters.cities",
  });

  React.useEffect(() => {
    if (problemType === 'tsp'){
      setValue('dimension', fields.length);
    }
    else if (problemType === 'GPA'){
      setValue('dimension', 5);
    }
  }, [fields, setValue]);

  const addCity = () => {
    console.log(`add city, cities.len: ${currentDimension}`);
    const city : City = {x:0, y:0};
    //console.log(`len of city: ${city.length}`)
    append(city);
    console.log(`cities.len: ${currentDimension}`);
  };

  const removeCity = (index: number) => {
    remove(index);
  };

  const currentDimension = watch('dimension', fields.length);

  return (
    <div className='card'>
      <div className='card-header'>
        <h2 className='card-title'>Optimization Parameters</h2>
      </div>
      <div>
        <RadixForm.Root onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4"> {/* Equivalent of CardContent or just spacing */}
            <RadixForm.Field name="population_size" className='form-field'>
              <div className='flex-center'>
                <RadixForm.Label className='label'>Population Size</RadixForm.Label>
                <RadixForm.Message match="valueMissing" className='error-message'>
                  Population size is required.
                </RadixForm.Message>
                 <RadixForm.Message match={(value) => parseInt(value) < 10} className='error-message'>
                  Must be at least 10.
                </RadixForm.Message>
                 <RadixForm.Message match={(value) => parseInt(value) > 1000} className='error-message'>
                  Cannot exceed 1000.
                </RadixForm.Message>
              </div>
              <RadixForm.Control asChild>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  className='input'
                  {...register("population_size", {
                    valueAsNumber: true,
                    required: "Population size is required.",
                    min: { value: 10, message: "Must be at least 10." },
                    max: { value: 1000, message: "Cannot exceed 1000." }
                  })}
                />
              </RadixForm.Control>
              {errors.population_size && <p className='error-message'>{errors.population_size.message}</p>}
            </RadixForm.Field>

            <RadixForm.Field name="mutation_rate" className='form-field'>
                <RadixForm.Label className='label'>
                    Mutation Rate ({(watch('mutation_rate') * 100).toFixed(1)}%)
                </RadixForm.Label>
              <Controller
                name="mutation_rate"
                control={control}
                render={({ field }) => (
                  <RadixSlider.Root
                    className='slider-root'
                    value={[field.value * 100]}
                    onValueChange={(value) => field.onChange(value[0] / 100)}
                    min={0}
                    max={100}
                    step={1}
                  >
                    <RadixSlider.Track className='slider-track'>
                      <RadixSlider.Range className='slider-range' />
                    </RadixSlider.Track>
                    <RadixSlider.Thumb className='slider-thumb' aria-label="Mutation Rate" />
                  </RadixSlider.Root>
                )}
              />
            </RadixForm.Field>

            {problemType === "GPA" && <RadixForm.Field name="dimension" className='form-field'>
                <RadixForm.Label className='label'>
                    Moves Per Player ({(watch('dimension'))?.toFixed(0)}) [NOTE: The max runtime is 2s x (moves per player)]
                </RadixForm.Label>
              <Controller
                name="dimension"
                control={control}
                render={({ field }) => (
                  <RadixSlider.Root
                    className='slider-root'
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    min={3}
                    max={20}
                    step={1}
                  >
                    <RadixSlider.Track className='slider-track'>
                      <RadixSlider.Range className='slider-range'/>
                    </RadixSlider.Track>
                    <RadixSlider.Thumb className='slider-thumb' aria-label="Mutation Rate" />
                  </RadixSlider.Root>
                )}
              />
            </RadixForm.Field>}

            <RadixForm.Field name="crossover_rate" className='form-field'>
                <RadixForm.Label className='label'>
                    Crossover Rate ({(watch('crossover_rate') * 100).toFixed(1)}%)
                </RadixForm.Label>
              <Controller
                name="crossover_rate"
                control={control}
                render={({ field }) => (
                  <RadixSlider.Root
                    className='slider-root'
                    value={[field.value * 100]}
                    onValueChange={(value) => field.onChange(value[0] / 100)}
                    min={0}
                    max={100}
                    step={1}
                  >
                    <RadixSlider.Track className='slider-track'>
                      <RadixSlider.Range className='slider-range'/>
                    </RadixSlider.Track>
                    <RadixSlider.Thumb className='slider-thumb' aria-label="Crossover Rate" />
                  </RadixSlider.Root>
                )}
              />
            </RadixForm.Field>

            <RadixForm.Field name="max_generations" className='form-field'>
              <div className='flex-center'>
                 <RadixForm.Label className='label'>Max Generations</RadixForm.Label>
              </div>
              <RadixForm.Control asChild>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className='input'
                  {...register("max_generations", {
                    valueAsNumber: true,
                    required: "Max generations is required.",
                    min: { value: 1, message: "Must be at least 1." },
                    max: { value: 1000, message: "Cannot exceed 1000." }
                  })}
                />
              </RadixForm.Control>
              {errors.max_generations && <p className='error-message'>{errors.max_generations.message}</p>}
            </RadixForm.Field>

            {problemType === "tsp" && (
              <div className='form-field'> {/* Replaces FormItem */}
                <label className='label'>Cities (Dimension: {currentDimension})</label>
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                  <table className='table'>
                    <thead>
                      <tr>
                        <th className='th'>X</th>
                        <th className='th'>Y</th>
                        {/* <th className='th th-action'></th> approx w-16 */}
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((item, index) => (
                        <tr key={item.id}>
                          <td className='td'>
                            {/*
                              Using Controller here as register doesn't deeply watch array field changes
                              for validation as smoothly as Controller can, though for simple inputs
                              `register` is often fine. For consistency with sliders:
                            */}
                            <Controller
                                name={`parameters.cities.${index}.x`}
                                control={control}
                                rules={{ required: "X is required" }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <input
                                            type="number"
                                            {...field}
                                            className='input input-small' /* approx w-24 */
                                            onChange={e => field.onChange(Number(e.target.value))}
                                        />
                                        {fieldState.error && <p className='error-message'>{fieldState.error.message}</p>}
                                    </>
                                )}
                            />
                          </td>
                          <td className='td'>
                            <Controller
                                name={`parameters.cities.${index}.y`}
                                control={control}
                                rules={{ required: "Y is required" }}
                                render={({ field, fieldState }) => (
                                     <>
                                        <input
                                            type="number"
                                            {...field}
                                            className='input input-small'
                                            onChange={e => field.onChange(Number(e.target.value))}
                                        />
                                        {fieldState.error && <p className='error-message'>{fieldState.error.message}</p>}
                                    </>
                                )}
                            />
                          </td>
                          <td className='td'>
                            <button
                              type="button"
                              className='button button-ghost'
                              onClick={() => removeCity(index)}
                              disabled={fields.length <= 3}
                            >
                              <Trash2 style={{ height: '16px', width: '16px' }} /> {/* h-4 w-4 */}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className='button button-outline'
                  onClick={addCity}
                >
                  <Plus className='icon' /> {/* h-4 w-4 mr-2 */}
                  Add City
                </button>
              </div>
            )}
          </div>

          <RadixForm.Submit asChild>
            <button
              type="submit"
              className='button button-full-width'
              disabled={isRunning}
            >
              Start Optimization
            </button>
          </RadixForm.Submit>
        </RadixForm.Root>
      </div>
    </div>
  );
};

export default OptimizationForm;