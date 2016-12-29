//
//  SpriteComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import SpriteKit
import GameplayKit

class RenderComponent: GKComponent {

    let node = Node()
    
    func addChild(_ child: SKNode) {

        node.addChild(child)
    }
}
