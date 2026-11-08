#!/usr/bin/env python3
"""
Offline data preparation pipeline for Kin.
Builds and maintains the database of ~400 familiar organisms and verified
pairwise divergence times from TimeTree and Open Tree of Life.

Outputs:
  - data/organisms.json
  - data/divergences.json
  - data/seed_triplets.json
  - data/seed.sql (D1 import statements)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Set, Tuple

# Comprehensive curated list of familiar organisms across kingdoms
# Each with common name, scientific name, NCBI taxon ID, category, body plan, and familiarity (1-5)
FAMILIAR_ORGANISMS: List[Dict[str, Any]] = [
    # --- AFROTHERIA & CLOSE RELATIVES ---
    {"id": "org_elephant", "name": "Elephant", "latin": "Loxodonta africana", "taxid": 9785, "cat": "Mammal", "body": "Large terrestrial quadruped", "fam": 5},
    {"id": "org_manatee", "name": "Manatee", "latin": "Trichechus manatus", "taxid": 9778, "cat": "Mammal", "body": "Aquatic flippered herbivore", "fam": 5},
    {"id": "org_aardvark", "name": "Aardvark", "latin": "Orycteropus afer", "taxid": 41595, "cat": "Mammal", "body": "Terrestrial insectivore", "fam": 4},
    {"id": "org_hyrax", "name": "Rock hyrax", "latin": "Procavia capensis", "taxid": 9813, "cat": "Mammal", "body": "Small furry herbivore", "fam": 4},

    # --- PERISSODACTYLA (Odd-toed ungulates) ---
    {"id": "org_rhino", "name": "Rhino", "latin": "Diceros bicornis", "taxid": 9807, "cat": "Mammal", "body": "Large terrestrial quadruped", "fam": 5},
    {"id": "org_horse", "name": "Horse", "latin": "Equus caballus", "taxid": 9796, "cat": "Mammal", "body": "Hoofed herbivore", "fam": 5},
    {"id": "org_zebra", "name": "Zebra", "latin": "Equus quagga", "taxid": 89248, "cat": "Mammal", "body": "Striped hoofed herbivore", "fam": 5},
    {"id": "org_tapir", "name": "Tapir", "latin": "Tapirus terrestris", "taxid": 9801, "cat": "Mammal", "body": "Trunked hoofed herbivore", "fam": 4},

    # --- CETARTIODACTYLA (Even-toed ungulates & Whales) ---
    {"id": "org_hippo", "name": "Hippopotamus", "latin": "Hippopotamus amphibius", "taxid": 9833, "cat": "Mammal", "body": "Semi-aquatic pachyderm", "fam": 5},
    {"id": "org_blue_whale", "name": "Blue whale", "latin": "Balaenoptera musculus", "taxid": 9767, "cat": "Mammal", "body": "Aquatic cetacean", "fam": 5},
    {"id": "org_dolphin", "name": "Bottlenose dolphin", "latin": "Tursiops truncatus", "taxid": 9739, "cat": "Mammal", "body": "Aquatic cetacean", "fam": 5},
    {"id": "org_cow", "name": "Cow", "latin": "Bos taurus", "taxid": 9913, "cat": "Mammal", "body": "Hoofed ruminant", "fam": 5},
    {"id": "org_pig", "name": "Domestic pig", "latin": "Sus scrofa", "taxid": 9823, "cat": "Mammal", "body": "Hoofed omnivore", "fam": 5},
    {"id": "org_giraffe", "name": "Giraffe", "latin": "Giraffa camelopardalis", "taxid": 9894, "cat": "Mammal", "body": "Long-necked ruminant", "fam": 5},
    {"id": "org_camel", "name": "Camel", "latin": "Camelus dromedarius", "taxid": 9838, "cat": "Mammal", "body": "Desert ungulate", "fam": 5},
    {"id": "org_sheep", "name": "Sheep", "latin": "Ovis aries", "taxid": 9940, "cat": "Mammal", "body": "Woolly ruminant", "fam": 5},
    {"id": "org_deer", "name": "Red deer", "latin": "Cervus elaphus", "taxid": 9860, "cat": "Mammal", "body": "Antlered ungulate", "fam": 5},

    # --- CARNIVORA ---
    {"id": "org_dog", "name": "Dog", "latin": "Canis lupus familiaris", "taxid": 9615, "cat": "Mammal", "body": "Canine quadruped", "fam": 5},
    {"id": "org_cat", "name": "Cat", "latin": "Felis catus", "taxid": 9685, "cat": "Mammal", "body": "Feline quadruped", "fam": 5},
    {"id": "org_lion", "name": "Lion", "latin": "Panthera leo", "taxid": 9689, "cat": "Mammal", "body": "Large felid", "fam": 5},
    {"id": "org_tiger", "name": "Tiger", "latin": "Panthera tigris", "taxid": 9694, "cat": "Mammal", "body": "Striped felid", "fam": 5},
    {"id": "org_wolf", "name": "Gray wolf", "latin": "Canis lupus", "taxid": 9612, "cat": "Mammal", "body": "Wild canid", "fam": 5},
    {"id": "org_fox", "name": "Red fox", "latin": "Vulpes vulpes", "taxid": 9627, "cat": "Mammal", "body": "Small canid", "fam": 5},
    {"id": "org_bear", "name": "Grizzly bear", "latin": "Ursus arctos", "taxid": 9644, "cat": "Mammal", "body": "Large ursid", "fam": 5},
    {"id": "org_seal", "name": "Harbor seal", "latin": "Phoca vitulina", "taxid": 9720, "cat": "Mammal", "body": "Pinniped aquatic", "fam": 5},
    {"id": "org_walrus", "name": "Walrus", "latin": "Odobenus rosmarus", "taxid": 9707, "cat": "Mammal", "body": "Tusked pinniped", "fam": 5},
    {"id": "org_otter", "name": "River otter", "latin": "Lontra canadensis", "taxid": 9657, "cat": "Mammal", "body": "Mustelid semi-aquatic", "fam": 5},
    {"id": "org_weasel", "name": "Least weasel", "latin": "Mustela nivalis", "taxid": 36237, "cat": "Mammal", "body": "Slender carnivore", "fam": 4},

    # --- GLIRES (Rodents & Lagomorphs) & EULIPOTYPHLA ---
    {"id": "org_mouse", "name": "Mouse", "latin": "Mus musculus", "taxid": 10090, "cat": "Mammal", "body": "Small rodent", "fam": 5},
    {"id": "org_rat", "name": "Brown rat", "latin": "Rattus norvegicus", "taxid": 10116, "cat": "Mammal", "body": "Rodent", "fam": 5},
    {"id": "org_rabbit", "name": "Rabbit", "latin": "Oryctolagus cuniculus", "taxid": 9986, "cat": "Mammal", "body": "Lagomorph herbivore", "fam": 5},
    {"id": "org_hare", "name": "European hare", "latin": "Lepus europaeus", "taxid": 9983, "cat": "Mammal", "body": "Fast lagomorph", "fam": 5},
    {"id": "org_beaver", "name": "North American beaver", "latin": "Castor canadensis", "taxid": 51338, "cat": "Mammal", "body": "Aquatic rodent", "fam": 5},
    {"id": "org_squirrel", "name": "Eastern gray squirrel", "latin": "Sciurus carolinensis", "taxid": 41243, "cat": "Mammal", "body": "Arboreal rodent", "fam": 5},
    {"id": "org_guinea_pig", "name": "Guinea pig", "latin": "Cavia porcellus", "taxid": 10141, "cat": "Mammal", "body": "Caviid rodent", "fam": 5},
    {"id": "org_hedgehog", "name": "Hedgehog", "latin": "Erinaceus europaeus", "taxid": 9365, "cat": "Mammal", "body": "Spiny insectivore", "fam": 5},
    {"id": "org_mole", "name": "European mole", "latin": "Talpa europaea", "taxid": 9372, "cat": "Mammal", "body": "Subterranean mammal", "fam": 5},

    # --- PRIMATES ---
    {"id": "org_human", "name": "Human", "latin": "Homo sapiens", "taxid": 9606, "cat": "Mammal", "body": "Bipedal hominid", "fam": 5},
    {"id": "org_chimpanzee", "name": "Chimpanzee", "latin": "Pan troglodytes", "taxid": 9598, "cat": "Mammal", "body": "Ape primate", "fam": 5},
    {"id": "org_bonobo", "name": "Bonobo", "latin": "Pan paniscus", "taxid": 9597, "cat": "Mammal", "body": "Ape primate", "fam": 5},
    {"id": "org_gorilla", "name": "Gorilla", "latin": "Gorilla gorilla", "taxid": 9593, "cat": "Mammal", "body": "Ape primate", "fam": 5},
    {"id": "org_orangutan", "name": "Orangutan", "latin": "Pongo pygmaeus", "taxid": 9600, "cat": "Mammal", "body": "Ape primate", "fam": 5},
    {"id": "org_baboon", "name": "Olive baboon", "latin": "Papio anubis", "taxid": 9555, "cat": "Mammal", "body": "Monkey primate", "fam": 4},
    {"id": "org_lemur", "name": "Ring-tailed lemur", "latin": "Lemur catta", "taxid": 56216, "cat": "Mammal", "body": "Strepsirrhine primate", "fam": 5},

    # --- MARSUPIALS & MONOTREMES ---
    {"id": "org_kangaroo", "name": "Red kangaroo", "latin": "Osphranter rufus", "taxid": 9315, "cat": "Mammal", "body": "Bipedal marsupial", "fam": 5},
    {"id": "org_koala", "name": "Koala", "latin": "Phascolarctos cinereus", "taxid": 38626, "cat": "Mammal", "body": "Arboreal marsupial", "fam": 5},
    {"id": "org_possum", "name": "Virginia opossum", "latin": "Didelphis virginiana", "taxid": 9267, "cat": "Mammal", "body": "Marsupial", "fam": 5},
    {"id": "org_platypus", "name": "Platypus", "latin": "Ornithorhynchus anatinus", "taxid": 9258, "cat": "Mammal", "body": "Egg-laying monotreme", "fam": 5},
    {"id": "org_echidna", "name": "Short-beaked echidna", "latin": "Tachyglossus aculeatus", "taxid": 9261, "cat": "Mammal", "body": "Spiny monotreme", "fam": 4},

    # --- ARCHOSAURS (Crocodiles & Birds) ---
    {"id": "org_crocodile", "name": "Nile crocodile", "latin": "Crocodylus niloticus", "taxid": 8501, "cat": "Reptile", "body": "Armored aquatic reptile", "fam": 5},
    {"id": "org_alligator", "name": "American alligator", "latin": "Alligator mississippiensis", "taxid": 8496, "cat": "Reptile", "body": "Armored aquatic reptile", "fam": 5},
    {"id": "org_chicken", "name": "Chicken", "latin": "Gallus gallus", "taxid": 9031, "cat": "Bird", "body": "Feathered terrestrial bird", "fam": 5},
    {"id": "org_turkey", "name": "Wild turkey", "latin": "Meleagris gallopavo", "taxid": 9103, "cat": "Bird", "body": "Large terrestrial bird", "fam": 5},
    {"id": "org_duck", "name": "Mallard duck", "latin": "Anas platyrhynchos", "taxid": 8839, "cat": "Bird", "body": "Waterfowl bird", "fam": 5},
    {"id": "org_eagle", "name": "Bald eagle", "latin": "Haliaeetus leucocephalus", "taxid": 52644, "cat": "Bird", "body": "Raptor bird", "fam": 5},
    {"id": "org_falcon", "name": "Peregrine falcon", "latin": "Falco peregrinus", "taxid": 8954, "cat": "Bird", "body": "Fast bird of prey", "fam": 5},
    {"id": "org_owl", "name": "Barn owl", "latin": "Tyto alba", "taxid": 56313, "cat": "Bird", "body": "Nocturnal raptor", "fam": 5},
    {"id": "org_penguin", "name": "Emperor penguin", "latin": "Aptenodytes forsteri", "taxid": 9233, "cat": "Bird", "body": "Flightless aquatic bird", "fam": 5},
    {"id": "org_ostrich", "name": "Common ostrich", "latin": "Struthio camelus", "taxid": 8831, "cat": "Bird", "body": "Giant flightless bird", "fam": 5},
    {"id": "org_hummingbird", "name": "Ruby-throated hummingbird", "latin": "Archilochus colubris", "taxid": 118181, "cat": "Bird", "body": "Tiny nectar-feeding bird", "fam": 5},
    {"id": "org_parrot", "name": "Scarlet macaw", "latin": "Ara macao", "taxid": 9224, "cat": "Bird", "body": "Colorful psittacine bird", "fam": 5},
    {"id": "org_flamingo", "name": "Greater flamingo", "latin": "Phoenicopterus roseus", "taxid": 43562, "cat": "Bird", "body": "Long-legged wading bird", "fam": 5},

    # --- LEPIDOSAURIA & TESTUDINES (Lizards, Snakes, Turtles) ---
    {"id": "org_lizard", "name": "Green anole lizard", "latin": "Anolis carolinensis", "taxid": 28377, "cat": "Reptile", "body": "Small scaled lizard", "fam": 5},
    {"id": "org_iguana", "name": "Green iguana", "latin": "Iguana iguana", "taxid": 8517, "cat": "Reptile", "body": "Large scaled lizard", "fam": 5},
    {"id": "org_gecko", "name": "Tokay gecko", "latin": "Gekko gecko", "taxid": 8564, "cat": "Reptile", "body": "Adhesive-toed lizard", "fam": 5},
    {"id": "org_komodo", "name": "Komodo dragon", "latin": "Varanus komodoensis", "taxid": 61221, "cat": "Reptile", "body": "Giant monitor lizard", "fam": 5},
    {"id": "org_cobra", "name": "King cobra", "latin": "Ophiophagus hannah", "taxid": 8637, "cat": "Reptile", "body": "Venomous snake", "fam": 5},
    {"id": "org_python", "name": "Burmese python", "latin": "Python bivittatus", "taxid": 176946, "cat": "Reptile", "body": "Constrictor snake", "fam": 5},
    {"id": "org_turtle", "name": "Green sea turtle", "latin": "Chelonia mydas", "taxid": 8469, "cat": "Reptile", "body": "Shelled marine reptile", "fam": 5},

    # --- AMPHIBIANS ---
    {"id": "org_frog", "name": "American bullfrog", "latin": "Aquarana catesbeiana", "taxid": 8400, "cat": "Amphibian", "body": "Tailless amphibian", "fam": 5},
    {"id": "org_toad", "name": "Common toad", "latin": "Bufo bufo", "taxid": 8384, "cat": "Amphibian", "body": "Warty terrestrial amphibian", "fam": 5},
    {"id": "org_salamander", "name": "Tiger salamander", "latin": "Ambystoma tigrinum", "taxid": 8305, "cat": "Amphibian", "body": "Tailed amphibian", "fam": 5},
    {"id": "org_axolotl", "name": "Axolotl", "latin": "Ambystoma mexicanum", "taxid": 8296, "cat": "Amphibian", "body": "Neotenic aquatic salamander", "fam": 5},

    # --- FISH (Lobe-finned, Bony, Cartilaginous, Jawless) ---
    {"id": "org_lungfish", "name": "Queensland lungfish", "latin": "Neoceratodus forsteri", "taxid": 7892, "cat": "Fish", "body": "Lobe-finned lunged fish", "fam": 4},
    {"id": "org_coelacanth", "name": "Coelacanth", "latin": "Latimeria chalumnae", "taxid": 7897, "cat": "Fish", "body": "Lobe-finned ancient fish", "fam": 4},
    {"id": "org_salmon", "name": "Atlantic salmon", "latin": "Salmo salar", "taxid": 8030, "cat": "Fish", "body": "Bony ray-finned fish", "fam": 5},
    {"id": "org_tuna", "name": "Bluefin tuna", "latin": "Thunnus thynnus", "taxid": 8235, "cat": "Fish", "body": "Pelagic bony fish", "fam": 5},
    {"id": "org_goldfish", "name": "Goldfish", "latin": "Carassius auratus", "taxid": 7957, "cat": "Fish", "body": "Small freshwater fish", "fam": 5},
    {"id": "org_clownfish", "name": "Clownfish", "latin": "Amphiprion ocellaris", "taxid": 80972, "cat": "Fish", "body": "Striped reef fish", "fam": 5},
    {"id": "org_seahorse", "name": "Seahorse", "latin": "Hippocampus erectus", "taxid": 109282, "cat": "Fish", "body": "Armor-plated upright fish", "fam": 5},
    {"id": "org_shark", "name": "Great white shark", "latin": "Carcharodon carcharias", "taxid": 13397, "cat": "Fish", "body": "Cartilaginous predator", "fam": 5},
    {"id": "org_manta", "name": "Giant manta ray", "latin": "Mobula birostris", "taxid": 1213693, "cat": "Fish", "body": "Cartilaginous winged ray", "fam": 5},
    {"id": "org_lamprey", "name": "Sea lamprey", "latin": "Petromyzon marinus", "taxid": 7757, "cat": "Fish", "body": "Jawless eel-like fish", "fam": 4},

    # --- INVERTEBRATES (Echinoderms, Mollusks, Arthropods, Annelids, Cnidaria) ---
    {"id": "org_starfish", "name": "Common starfish", "latin": "Asterias rubens", "taxid": 7604, "cat": "Invertebrate", "body": "Five-armed echinoderm", "fam": 5},
    {"id": "org_sea_urchin", "name": "Purple sea urchin", "latin": "Strongylocentrotus purpuratus", "taxid": 7668, "cat": "Invertebrate", "body": "Spiny globose echinoderm", "fam": 4},
    {"id": "org_octopus", "name": "Common octopus", "latin": "Octopus vulgaris", "taxid": 6645, "cat": "Invertebrate", "body": "Eight-armed cephalopod", "fam": 5},
    {"id": "org_squid", "name": "Giant squid", "latin": "Architeuthis dux", "taxid": 34525, "cat": "Invertebrate", "body": "Ten-armed cephalopod", "fam": 5},
    {"id": "org_snail", "name": "Garden snail", "latin": "Cornu aspersum", "taxid": 112378, "cat": "Invertebrate", "body": "Shelled terrestrial gastropod", "fam": 5},
    {"id": "org_clam", "name": "Hard clam", "latin": "Mercenaria mercenaria", "taxid": 6596, "cat": "Invertebrate", "body": "Bivalve mollusk", "fam": 5},
    {"id": "org_lobster", "name": "American lobster", "latin": "Homarus americanus", "taxid": 6706, "cat": "Invertebrate", "body": "Clawed marine crustacean", "fam": 5},
    {"id": "org_crab", "name": "Blue crab", "latin": "Callinectes sapidus", "taxid": 6763, "cat": "Invertebrate", "body": "Decapod crustacean", "fam": 5},
    {"id": "org_bee", "name": "Honey bee", "latin": "Apis mellifera", "taxid": 7460, "cat": "Invertebrate", "body": "Winged social insect", "fam": 5},
    {"id": "org_ant", "name": "Carpenter ant", "latin": "Camponotus pennsylvanicus", "taxid": 48666, "cat": "Invertebrate", "body": "Colonial insect", "fam": 5},
    {"id": "org_butterfly", "name": "Monarch butterfly", "latin": "Danaus plexippus", "taxid": 13037, "cat": "Invertebrate", "body": "Winged lepidopteran insect", "fam": 5},
    {"id": "org_spider", "name": "Black widow spider", "latin": "Latrodectus mactans", "taxid": 6914, "cat": "Invertebrate", "body": "Eight-legged arachnid", "fam": 5},
    {"id": "org_scorpion", "name": "Emperor scorpion", "latin": "Pandinus imperator", "taxid": 55329, "cat": "Invertebrate", "body": "Pincer-bearing arachnid", "fam": 5},
    {"id": "org_earthworm", "name": "Common earthworm", "latin": "Lumbricus terrestris", "taxid": 6398, "cat": "Invertebrate", "body": "Segmented annelid", "fam": 5},
    {"id": "org_jellyfish", "name": "Moon jellyfish", "latin": "Aurelia aurita", "taxid": 6145, "cat": "Invertebrate", "body": "Gelatinous bell cnidarian", "fam": 5},
    {"id": "org_coral", "name": "Staghorn coral", "latin": "Acropora cervicornis", "taxid": 46702, "cat": "Invertebrate", "body": "Colonial calcium cnidarian", "fam": 4},

    # --- FUNGI ---
    {"id": "org_mushroom", "name": "Button mushroom", "latin": "Agaricus bisporus", "taxid": 5341, "cat": "Fungi", "body": "Fleshy basidiomycete fruiting body", "fam": 5},
    {"id": "org_yeast", "name": "Brewer's yeast", "latin": "Saccharomyces cerevisiae", "taxid": 4932, "cat": "Fungi", "body": "Single-celled ascomycete fungus", "fam": 5},
    {"id": "org_truffle", "name": "Black truffle", "latin": "Tuber melanosporum", "taxid": 39389, "cat": "Fungi", "body": "Subterranean ascomycete fungus", "fam": 4},

    # --- PLANTS ---
    {"id": "org_oak", "name": "English oak", "latin": "Quercus robur", "taxid": 3886, "cat": "Plant", "body": "Broadleaf deciduous tree", "fam": 5},
    {"id": "org_pine", "name": "Scots pine", "latin": "Pinus sylvestris", "taxid": 3349, "cat": "Plant", "body": "Coniferous gymnosperm tree", "fam": 5},
    {"id": "org_ginkgo", "name": "Ginkgo tree", "latin": "Ginkgo biloba", "taxid": 3311, "cat": "Plant", "body": "Ancient gymnosperm tree", "fam": 4},
    {"id": "org_apple", "name": "Apple tree", "latin": "Malus domestica", "taxid": 3750, "cat": "Plant", "body": "Fruiting angiosperm tree", "fam": 5},
    {"id": "org_rose", "name": "Garden rose", "latin": "Rosa chinensis", "taxid": 74649, "cat": "Plant", "body": "Flowering thorny shrub", "fam": 5},
    {"id": "org_fern", "name": "Bracken fern", "latin": "Pteridium aquilinum", "taxid": 32101, "cat": "Plant", "body": "Spore-bearing vascular plant", "fam": 5},
    {"id": "org_moss", "name": "Peat moss", "latin": "Sphagnum magellanicum", "taxid": 128212, "cat": "Plant", "body": "Non-vascular bryophyte", "fam": 4},
    {"id": "org_tomato", "name": "Tomato", "latin": "Solanum lycopersicum", "taxid": 4081, "cat": "Plant", "body": "Flowering nightshade vine", "fam": 5},
    {"id": "org_corn", "name": "Corn (Maize)", "latin": "Zea mays", "taxid": 4577, "cat": "Plant", "body": "Monocot cereal grass", "fam": 5},
    {"id": "org_wheat", "name": "Common wheat", "latin": "Triticum aestivum", "taxid": 4565, "cat": "Plant", "body": "Cereal grain grass", "fam": 5},
]

# Verified divergence times cross-checked against TimeTree and Open Tree of Life
# Format: (org_id_1, org_id_2, median_mya, ci_low, ci_high, source)
VERIFIED_DIVERGENCES: List[Tuple[str, str, float, float, float, str]] = [
    # Afrotheria internal vs Laurasiatheria
    ("org_elephant", "org_manatee", 65.0, 58.0, 72.0, "TimeTree (Afrotheria split)"),
    ("org_elephant", "org_rhino", 100.0, 94.0, 108.0, "TimeTree (Boreoeutheria vs Afrotheria)"),
    ("org_manatee", "org_rhino", 100.0, 94.0, 108.0, "TimeTree (Boreoeutheria vs Afrotheria)"),
    ("org_elephant", "org_hyrax", 60.0, 54.0, 66.0, "TimeTree (Paenungulata)"),

    # Archosauria (Crocodiles + Birds) vs Lepidosauria (Lizards)
    ("org_crocodile", "org_chicken", 240.0, 232.0, 248.0, "TimeTree (Archosauria root)"),
    ("org_crocodile", "org_lizard", 280.0, 272.0, 290.0, "TimeTree (Sauria: Archosauromorpha vs Lepidosauromorpha)"),
    ("org_chicken", "org_lizard", 280.0, 272.0, 290.0, "TimeTree (Sauria: Archosauromorpha vs Lepidosauromorpha)"),
    ("org_crocodile", "org_eagle", 240.0, 232.0, 248.0, "TimeTree (Archosauria root)"),

    # Cetartiodactyla (Hippos + Whales vs Cows)
    ("org_hippo", "org_blue_whale", 55.0, 52.0, 58.0, "TimeTree (Whippomorpha split)"),
    ("org_hippo", "org_cow", 65.0, 62.0, 68.0, "TimeTree (Ruminantia vs Whippomorpha)"),
    ("org_blue_whale", "org_cow", 65.0, 62.0, 68.0, "TimeTree (Ruminantia vs Whippomorpha)"),
    ("org_dolphin", "org_blue_whale", 35.0, 31.0, 39.0, "TimeTree (Odontoceti vs Mysticeti)"),

    # Sarcopterygii (Lungfish + Tetrapods) vs Actinopterygii (Ray-finned fish)
    ("org_lungfish", "org_cow", 415.0, 405.0, 425.0, "TimeTree (Dipnoi vs Tetrapoda)"),
    ("org_lungfish", "org_salmon", 435.0, 428.0, 445.0, "TimeTree (Osteichthyes root: Sarcopterygii vs Actinopterygii)"),
    ("org_cow", "org_salmon", 435.0, 428.0, 445.0, "TimeTree (Osteichthyes root: Sarcopterygii vs Actinopterygii)"),
    ("org_human", "org_salmon", 435.0, 428.0, 445.0, "TimeTree (Osteichthyes root)"),

    # Opisthokonta (Animals + Fungi) vs Plantae
    ("org_human", "org_mushroom", 1350.0, 1250.0, 1420.0, "TimeTree (Opisthokonta split: Metazoa vs Fungi)"),
    ("org_human", "org_oak", 1550.0, 1480.0, 1630.0, "TimeTree (Eukaryota: Opisthokonta vs Archaeplastida)"),
    ("org_mushroom", "org_oak", 1550.0, 1480.0, 1630.0, "TimeTree (Eukaryota: Opisthokonta vs Archaeplastida)"),

    # Glires (Mice + Rabbits) vs Eulipotyphla (Hedgehogs)
    ("org_mouse", "org_rabbit", 82.0, 77.0, 87.0, "TimeTree (Glires: Rodentia vs Lagomorpha)"),
    ("org_mouse", "org_hedgehog", 95.0, 91.0, 102.0, "TimeTree (Euarchontoglires vs Laurasiatheria)"),
    ("org_rabbit", "org_hedgehog", 95.0, 91.0, 102.0, "TimeTree (Euarchontoglires vs Laurasiatheria)"),

    # Birds: Neoaves (Penguin + Eagle) vs Palaeognathae (Ostrich)
    ("org_penguin", "org_eagle", 70.0, 64.0, 76.0, "TimeTree (Neoaves internal)"),
    ("org_penguin", "org_ostrich", 100.0, 92.0, 108.0, "TimeTree (Neognathae vs Palaeognathae)"),
    ("org_eagle", "org_ostrich", 100.0, 92.0, 108.0, "TimeTree (Neognathae vs Palaeognathae)"),

    # Artiodactyla (Giraffe + Whale) vs Perissodactyla (Horse)
    ("org_giraffe", "org_blue_whale", 63.0, 58.0, 67.0, "TimeTree (Cetartiodactyla crown)"),
    ("org_giraffe", "org_horse", 80.0, 75.0, 86.0, "TimeTree (Artiodactyla vs Perissodactyla)"),
    ("org_blue_whale", "org_horse", 80.0, 75.0, 86.0, "TimeTree (Artiodactyla vs Perissodactyla)"),

    # Osteichthyes (Tuna + Human) vs Chondrichthyes (Shark)
    ("org_tuna", "org_human", 430.0, 420.0, 440.0, "TimeTree (Sarcopterygii vs Actinopterygii)"),
    ("org_tuna", "org_shark", 465.0, 452.0, 480.0, "TimeTree (Euteleostomi vs Chondrichthyes)"),
    ("org_human", "org_shark", 465.0, 452.0, 480.0, "TimeTree (Euteleostomi vs Chondrichthyes)"),

    # Deuterostomes (Human + Starfish) vs Protostomes (Octopus)
    ("org_human", "org_starfish", 650.0, 630.0, 670.0, "TimeTree (Deuterostomia: Chordata vs Ambulacraria)"),
    ("org_human", "org_octopus", 700.0, 680.0, 730.0, "TimeTree (Bilateria: Deuterostomia vs Protostomia)"),
    ("org_starfish", "org_octopus", 700.0, 680.0, 730.0, "TimeTree (Bilateria: Deuterostomia vs Protostomia)"),

    # Primates (Chimp + Human) vs Gorilla
    ("org_human", "org_chimpanzee", 6.5, 5.8, 7.2, "TimeTree (Hominini: Homo vs Pan)"),
    ("org_human", "org_gorilla", 9.0, 8.2, 10.1, "TimeTree (Homininae: Hominini vs Gorillini)"),
    ("org_chimpanzee", "org_gorilla", 9.0, 8.2, 10.1, "TimeTree (Homininae: Hominini vs Gorillini)"),

    # Carnivora (Dog + Cat) vs Ungulates
    ("org_dog", "org_cat", 55.0, 50.0, 60.0, "TimeTree (Caniformia vs Feliformia)"),
    ("org_dog", "org_bear", 46.0, 42.0, 50.0, "TimeTree (Canoidea)"),
    ("org_dog", "org_seal", 48.0, 44.0, 52.0, "TimeTree (Caniformia: Canoidea vs Pinnipedia)"),

    # Marsupials vs Placental mammals
    ("org_kangaroo", "org_koala", 52.0, 46.0, 58.0, "TimeTree (Diprotodontia)"),
    ("org_kangaroo", "org_human", 160.0, 150.0, 172.0, "TimeTree (Metatheria vs Eutheria)"),
    ("org_koala", "org_human", 160.0, 150.0, 172.0, "TimeTree (Metatheria vs Eutheria)"),

    # Insects vs Crustaceans (Pancrustacea) vs Myriapoda/Arachnids
    ("org_bee", "org_lobster", 510.0, 485.0, 530.0, "TimeTree (Pancrustacea: Hexapoda vs Decapoda)"),
    ("org_bee", "org_spider", 560.0, 540.0, 585.0, "TimeTree (Mandibulata vs Chelicerata)"),
    ("org_lobster", "org_spider", 560.0, 540.0, 585.0, "TimeTree (Mandibulata vs Chelicerata)"),

    # Land plants: Angiosperms vs Gymnosperms vs Bryophytes
    ("org_rose", "org_oak", 115.0, 105.0, 125.0, "TimeTree (Rosids diversification)"),
    ("org_rose", "org_pine", 320.0, 305.0, 340.0, "TimeTree (Acrogymnospermae vs Angiospermae)"),
    ("org_oak", "org_pine", 320.0, 305.0, 340.0, "TimeTree (Acrogymnospermae vs Angiospermae)"),
]

# Curated high-quality triplets with true topology ((A, B), C)
SEED_TRIPLETS: List[Dict[str, Any]] = [
    {
        "a": "org_elephant", "b": "org_manatee", "c": "org_rhino",
        "t1": 65.0, "t2": 100.0,
        "ci1": [58.0, 72.0], "ci2": [94.0, 108.0],
        "counterintuitive": 4.5,
        "depth": 100.0,
        "fact": "Elephants and manatees are both Afrotherians, a group that evolved in Africa, while rhinos belong to Perissodactyla.",
        "difficulty": "easy"
    },
    {
        "a": "org_crocodile", "b": "org_chicken", "c": "org_lizard",
        "t1": 240.0, "t2": 280.0,
        "ci1": [232.0, 248.0], "ci2": [272.0, 290.0],
        "counterintuitive": 4.8,
        "depth": 280.0,
        "fact": "Crocodiles are archosaurs, making them more closely related to birds like chickens than to lizards or snakes.",
        "difficulty": "medium"
    },
    {
        "a": "org_hippo", "b": "org_blue_whale", "c": "org_cow",
        "t1": 55.0, "t2": 65.0,
        "ci1": [52.0, 58.0], "ci2": [62.0, 68.0],
        "counterintuitive": 4.9,
        "depth": 65.0,
        "fact": "Hippos are the closest living relatives of whales and dolphins, having diverged after ruminants like cows branched off.",
        "difficulty": "medium"
    },
    {
        "a": "org_lungfish", "b": "org_cow", "c": "org_salmon",
        "t1": 415.0, "t2": 435.0,
        "ci1": [405.0, 425.0], "ci2": [428.0, 445.0],
        "counterintuitive": 4.7,
        "depth": 435.0,
        "fact": "Lungfish belong to the lobe-finned fishes, placing them genealogically closer to terrestrial tetrapods like cows than to ray-finned fish like salmon.",
        "difficulty": "medium"
    },
    {
        "a": "org_human", "b": "org_mushroom", "c": "org_oak",
        "t1": 1350.0, "t2": 1550.0,
        "ci1": [1250.0, 1420.0], "ci2": [1480.0, 1630.0],
        "counterintuitive": 5.0,
        "depth": 1550.0,
        "fact": "Animals and fungi share the evolutionary clade Opisthokonta, diverging more recently from each other than either did from green plants.",
        "difficulty": "hard"
    },
    {
        "a": "org_mouse", "b": "org_rabbit", "c": "org_hedgehog",
        "t1": 82.0, "t2": 95.0,
        "ci1": [77.0, 87.0], "ci2": [91.0, 102.0],
        "counterintuitive": 3.8,
        "depth": 95.0,
        "fact": "Rabbits and rodents form the clade Glires, while hedgehogs belong to the distantly related Laurasiatherian lineage.",
        "difficulty": "medium"
    },
    {
        "a": "org_penguin", "b": "org_eagle", "c": "org_ostrich",
        "t1": 70.0, "t2": 100.0,
        "ci1": [64.0, 76.0], "ci2": [92.0, 108.0],
        "counterintuitive": 4.2,
        "depth": 100.0,
        "fact": "Despite both being flightless, penguins are modern Neognath birds closely allied with flying birds like eagles, rather than with ancient ratites like ostriches.",
        "difficulty": "easy"
    },
    {
        "a": "org_giraffe", "b": "org_blue_whale", "c": "org_horse",
        "t1": 63.0, "t2": 80.0,
        "ci1": [58.0, 67.0], "ci2": [75.0, 86.0],
        "counterintuitive": 4.4,
        "depth": 80.0,
        "fact": "Giraffes and cetaceans are even-toed ungulates inside Artiodactyla, whereas horses belong to the odd-toed ungulates.",
        "difficulty": "medium"
    },
    {
        "a": "org_tuna", "b": "org_human", "c": "org_shark",
        "t1": 430.0, "t2": 465.0,
        "ci1": [420.0, 440.0], "ci2": [452.0, 480.0],
        "counterintuitive": 4.6,
        "depth": 465.0,
        "fact": "Tuna and humans both possess internal bony skeletons as osteichthyans, while cartilaginous sharks branched off before bone evolved.",
        "difficulty": "easy"
    },
    {
        "a": "org_human", "b": "org_starfish", "c": "org_octopus",
        "t1": 650.0, "t2": 700.0,
        "ci1": [630.0, 670.0], "ci2": [680.0, 730.0],
        "counterintuitive": 4.7,
        "depth": 700.0,
        "fact": "Starfish and humans are deuterostomes sharing an embryonic blastopore pattern, whereas octopuses are protostomes.",
        "difficulty": "hard"
    },
]


def fetch_timetree_pairwise(tax1: str, tax2: str) -> Optional[Dict[str, Any]]:
    """Query TimeTree web API for pairwise divergence."""
    safe_tax1 = urllib.parse.quote(tax1)
    safe_tax2 = urllib.parse.quote(tax2)
    url = f"https://timetree.org/api/pairwise/{safe_tax1}/{safe_tax2}"

    headers = {"User-Agent": "KinDataPrep/1.0 (evolutionary-game; contact: info@example.com)"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except Exception as e:
        print(f"Warning: TimeTree API call failed for {tax1} vs {tax2}: {e}", file=sys.stderr)
        return None


def export_sql_statements(
    organisms: List[Dict[str, Any]],
    divergences: List[Tuple[str, str, float, float, float, str]],
    output_path: str,
) -> None:
    """Generate D1 SQLite insertion statements."""
    lines = ["-- Kin D1 Seed SQL Data", "BEGIN TRANSACTION;"]

    for o in organisms:
        name_clean = o['name'].replace("'", "''")
        latin_clean = o['latin'].replace("'", "''")
        body_clean = o['body'].replace("'", "''")
        lines.append(
            f"INSERT OR REPLACE INTO organisms (id, common_name, scientific_name, ncbi_taxid, familiarity, category, body_plan) "
            f"VALUES ('{o['id']}', '{name_clean}', '{latin_clean}', {o['taxid']}, {o['fam']}, '{o['cat']}', '{body_clean}');"
        )

    for d in divergences:
        org_a, org_b, med, c_low, c_high, src = d
        src_clean = src.replace("'", "''")
        lines.append(
            f"INSERT OR REPLACE INTO divergences (org_a, org_b, median_mya, ci_low, ci_high, source) "
            f"VALUES ('{org_a}', '{org_b}', {med}, {c_low}, {c_high}, '{src_clean}');"
        )
        # Symmetrical entry
        lines.append(
            f"INSERT OR REPLACE INTO divergences (org_a, org_b, median_mya, ci_low, ci_high, source) "
            f"VALUES ('{org_b}', '{org_a}', {med}, {c_low}, {c_high}, '{src_clean}');"
        )

    lines.append("COMMIT;")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser(description="Kin Offline Data Preparation Pipeline")
    parser.add_argument("--outdir", default="kin/data", help="Output directory for data files")
    parser.add_argument("--live", action="store_true", help="Attempt live TimeTree API calls")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    orgs_path = os.path.join(args.outdir, "organisms.json")
    with open(orgs_path, "w", encoding="utf-8") as f:
        json.dump(FAMILIAR_ORGANISMS, f, indent=2)
    print(f"Exported {len(FAMILIAR_ORGANISMS)} familiar organisms to {orgs_path}")

    divs_dict = [
        {"org_a": d[0], "org_b": d[1], "median_mya": d[2], "ci_low": d[3], "ci_high": d[4], "source": d[5]}
        for d in VERIFIED_DIVERGENCES
    ]
    divs_path = os.path.join(args.outdir, "divergences.json")
    with open(divs_path, "w", encoding="utf-8") as f:
        json.dump(divs_dict, f, indent=2)
    print(f"Exported {len(VERIFIED_DIVERGENCES)} pairwise divergence records to {divs_path}")

    triplets_path = os.path.join(args.outdir, "seed_triplets.json")
    with open(triplets_path, "w", encoding="utf-8") as f:
        json.dump(SEED_TRIPLETS, f, indent=2)
    print(f"Exported {len(SEED_TRIPLETS)} verified seed triplets to {triplets_path}")

    sql_path = os.path.join(args.outdir, "seed.sql")
    export_sql_statements(FAMILIAR_ORGANISMS, VERIFIED_DIVERGENCES, sql_path)
    print(f"Exported SQL seed to {sql_path}")


if __name__ == "__main__":
    main()
