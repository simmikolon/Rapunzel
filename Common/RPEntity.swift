//
//  RPEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit

protocol RPEntityDelegate: class {
    
    func entityDidAddComponent(withEntity entity: GKEntity, andComponent component: GKComponent)
}

class RPEntity: GKEntity {

    weak var delegate: RPEntityDelegate?
}
