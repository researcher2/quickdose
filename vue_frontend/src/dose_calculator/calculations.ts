import {elekta_af_6x} from "./datasets/elekta_af_6x"
import {elekta_af_10x} from "./datasets/elekta_af_10x"
import {varian_af_6x} from "./datasets/varian_af_6x"
import {varian_af_10x} from "./datasets/varian_af_10x"

import {elekta_pdd_6x} from "./datasets/elekta_pdd_6x"
import {elekta_pdd_10x} from "./datasets/elekta_pdd_10x"
import {varian_pdd_6x} from "./datasets/varian_pdd_6x"
import {varian_pdd_10x} from "./datasets/varian_pdd_10x"

interface Dataset
{    
    output_factors: Array<Array<number>>,
    pdds: Array<Array<number>>,
    dmax: number
}

const datasets = {
    Elekta: 
    {
        "6": {
            output_factors: elekta_af_6x,
            pdds: elekta_pdd_6x,
            dmax: 1.6},
        "10": {
            output_factors: elekta_af_10x,
            pdds: elekta_pdd_10x,
            dmax: 2.2}
    },
    Varian: 
    {
        "6": {
            output_factors: varian_af_6x,
            pdds: varian_pdd_6x,
            dmax: 1.4},
        "10": {
            output_factors: varian_af_10x,
            pdds: varian_pdd_10x,
            dmax: 2.2}
    }
}

interface Point
{
    x: number
    y: number
}

interface IndexPair
{
    lower_index: number
    upper_index: number
}

interface Result
{
    pdd: number
    f: number
    ssdf: number
    af: number
    dataset: Dataset
    af_pair: Array<number>
    pdd_depth_pair: Array<number>
    pdd_area_pair: Array<number>
    dose: number
}

function calculate_dose(manufacturer: "Elekta" | "Varian", energy: "6" | "10", monitor_units: number, 
                        field_size_x: number, field_size_y: number, depth: number, ssd: number) : Result
{    
    const dataset = datasets[manufacturer][energy];

    if (depth > dataset.pdds[0][-1])
        throw "Depth too large!"

    const k = 0.01;
    const f = calculate_f(dataset, ssd, depth);
    const ssdf = calculate_ssdf(dataset, ssd);
    const af_result = calculate_af(dataset, field_size_x, field_size_y);
    const af = af_result.af    
    const pdd_result = calculate_pdd(dataset, field_size_x, field_size_y, depth, ssd);
    const pdd = pdd_result.pdd;

    const dose = (monitor_units * k * pdd * ssdf * f) / af;
    console.log(monitor_units, k, pdd, ssdf, f, af, dose)

    const result = {
        f: f, 
        pdd: pdd, 
        ssdf: ssdf,
        af: af, 
        af_pair: [af_result.af_pair.lower_index, af_result.af_pair.upper_index], 
        dataset: dataset,
        pdd_area_pair: [pdd_result.area_pair.lower_index, pdd_result.area_pair.upper_index], 
        pdd_depth_pair: [pdd_result.depth_pair.lower_index, pdd_result.depth_pair.upper_index], 
        dose: dose
    };

    return result;
}

export { calculate_dose, type Dataset };

function calculate_pdd (dataset: Dataset, field_size_x: number, field_size_y: number, depth: number, ssd: number) 
{
    let pdd = 0;

    const field_size = field_size_x * field_size_y;
    const surface_field_size = field_size * Math.pow((ssd / 100),2);

    console.log(field_size, surface_field_size)

    const depth_pair = find_depth_pair(dataset, depth)
    const area_pair = find_area_pair(dataset.pdds, surface_field_size)

    // interpolate on lower area + varying depth
    let x_0 = dataset.pdds[0][depth_pair.lower_index];
    let x_1 = dataset.pdds[0][depth_pair.upper_index];

    let row = dataset.pdds[area_pair.lower_index]
    let y_0 = row[depth_pair.lower_index];
    let y_1 = row[depth_pair.upper_index];

    let lower = {x: x_0, y: y_0}
    let upper = {x: x_1, y: y_1}
    const lower_area_interpolated = linear_interpolate(lower, upper, depth)

    // interpolate on upper area + varying depth
    x_0 = dataset.pdds[0][depth_pair.lower_index];
    x_1 = dataset.pdds[0][depth_pair.upper_index];

    row = dataset.pdds[area_pair.upper_index]
    y_0 = row[depth_pair.lower_index];
    y_1 = row[depth_pair.upper_index];

    lower = {x: x_0, y: y_0}
    upper = {x: x_1, y: y_1}
    const upper_area_interpolated = linear_interpolate(lower, upper, depth)

    // interpolate on the resulting interpolations (varying area)
    x_0 = dataset.pdds[area_pair.lower_index][0];
    x_1 = dataset.pdds[area_pair.upper_index][0];

    y_0 = lower_area_interpolated;
    y_1 = upper_area_interpolated;

    lower = {x: x_0, y: y_0}
    upper = {x: x_1, y: y_1}
    pdd = linear_interpolate(lower, upper, surface_field_size)

    return {pdd: pdd, area_pair: area_pair, depth_pair: depth_pair};
}

function find_area_pair(rows: Array<Array<number>>, surface_field_size: number): IndexPair
{
    let lower = -1;
    let upper = -1;

    // loop to find the appropriate area (first column of each row apart from first)
    for (let i=1; i < rows.length; i++)
    {
        const area = rows[i][0];

        if (surface_field_size > area) {
            lower = i;
        } else if (surface_field_size == area) {
            lower = i;
            upper = i;
            break;
        } else {
            upper = i;
            break;
        }

    }

    return { lower_index: lower, upper_index: upper}
}

function find_depth_pair(dataset: Dataset, depth: number): IndexPair
{
    let lower = -1;
    let upper = -1;

    // loop first row that has depths
    for (const [index, dataset_depth] of dataset.pdds[0].entries())
    {
        if (depth > dataset_depth) {
            lower = index;
        } else if (depth == dataset_depth) {
            lower = index;
            upper = index;
            break;
        } else {
            upper = index;
            break;
        }
    }

    return { lower_index: lower, upper_index: upper}
}


function calculate_af (dataset: Dataset, field_size_x: number, field_size_y: number) 
{
    const area = field_size_x * field_size_y;
    const area_pair = find_area_pair(dataset.output_factors, area)

    let af = dataset.output_factors[area_pair.lower_index][1];
    if (area_pair.lower_index != area_pair.upper_index)
    {
        const row_lower = dataset.output_factors[area_pair.lower_index]
        const lower = {x: row_lower[0], y: row_lower[1]}

        const row_upper = dataset.output_factors[area_pair.upper_index]
        const upper = {x: row_upper[0], y: row_upper[1]}

        af = linear_interpolate(lower, upper, area);
    }

    return {af: af, af_pair: area_pair};
}

// http://en.wikipedia.org/wiki/Linear_interpolation
function linear_interpolate (lower: Point, upper: Point, middle_x: number){

    if (lower.x == upper.x)
        return lower.y;

    return lower.y + ((upper.y - lower.y) * (middle_x - lower.x) / (upper.x - lower.x));
}

function calculate_ssdf (dataset: Dataset, ssd: number)
{
    let ssdf_ratio = (100 + dataset.dmax);
    const ssdf_ratio_bottom = (ssd + dataset.dmax);

    ssdf_ratio = ssdf_ratio / (ssdf_ratio_bottom);

    return Math.pow(ssdf_ratio, 2);
}

function calculate_f (dataset: Dataset, ssd: number, depth: number)
{
    let f_ratio_left = (ssd + dataset.dmax) / (100 + dataset.dmax);
    f_ratio_left = Math.pow(f_ratio_left, 2);

    let f_ratio_right = (100 + depth) / (ssd + depth);
    f_ratio_right = Math.pow(f_ratio_right, 2);

    const f = f_ratio_left * f_ratio_right;

    return f;
}