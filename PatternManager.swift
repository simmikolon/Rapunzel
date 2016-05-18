//
//  PatternControllerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct PatternSettings {
    
    static let elementsPerBeat: Int = 5
    static let lengthOfBeat: CGFloat = 300
}

protocol PatternManagerDelegate: class {
    
    func createBeatElement(beatElement: BeatElement, offset: CGFloat)
}

class PatternManager {

    unowned let renderComponent: RenderComponent
    
    weak var delegate: PatternManagerDelegate?
    weak var pattern: Pattern? 
    
    var offset: CGFloat = 0
    var upperBeat: Int = 0
    var lowerBeat: Int = 0
    
    private var lastScrollingDelta: CGFloat = 0
    
    init(withLayerEntity layerEntity: LayerEntity, pattern: Pattern? = nil, delegate: PatternManagerDelegate? = nil) {
        
        self.delegate = delegate
        self.renderComponent = layerEntity.renderComponent
        self.pattern = pattern
        
        if self.pattern != nil {
            
            createStartupPatternBeats()
        }
    }
    
    func addBeat() {
        
        if let pattern = self.pattern {
            
            let beat = pattern.beats[pattern.cursor]
            
            if beat.type != .Empty {
                
                for element in beat.elements {
                    
                    if let delegate = self.delegate {
                        
                        delegate.createBeatElement(element, offset: offset)
                    }
                }
            }
            
            pattern.increaseCursor()
            offset += PatternSettings.lengthOfBeat
        }
    }
    
    func createStartupPatternBeats() {
        
        let screenSize = CGSize(width: GameSceneSettings.width, height: GameSceneSettings.height)
        
        while offset < screenSize.height { addBeat() }
        
        addBeat()
    }
    
    func didScrollUpOneBeat() {
        addBeat()
    }
    
    func didScrollDownOneBeat() {
    }
    
    // MARK: - Lifecycle
    
    func update() {
        
        let scrollingDelta = renderComponent.node.scene?.convertPoint(renderComponent.node.position, fromNode: renderComponent.node.parent!)
        
        if scrollingDelta!.y - lastScrollingDelta < -PatternSettings.lengthOfBeat {
            didScrollUpOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
            
        else if scrollingDelta!.y - lastScrollingDelta > PatternSettings.lengthOfBeat {
            didScrollDownOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
    }
}
